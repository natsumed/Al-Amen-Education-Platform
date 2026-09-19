import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createContentSchema, contentFiltersSchema } from "@/lib/validations"
import { stripMediaForList } from "@/lib/content-media"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    const filters = contentFiltersSchema.safeParse({
      ...params,
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 12,
      isFree: params.isFree === "true" ? true : params.isFree === "false" ? false : undefined,
    })

    if (!filters.success) return NextResponse.json({ error: "Filtres invalides" }, { status: 400 })
    const { grade, subject, contentType, language, isFree, search, page = 1, limit = 12 } = filters.data

    // Keep filtering portable across the supported PostgreSQL deployment.
    const where: Record<string, unknown> = {
      status: "PUBLISHED",
      assets: { some: { status: "READY", assetRole: "PRIMARY" } },
      ...(grade && { grade }),
      ...(subject && { subject }),
      ...(contentType && { contentType }),
      ...(language && { language }),
      ...(isFree !== undefined && { isFree }),
      ...(search && {
        OR: [
          { titleFr: { contains: search } },
          { titleAr: { contains: search } },
          { displayTitle: { contains: search } },
          { descriptionFr: { contains: search } },
          { descriptionAr: { contains: search } },
          { titleEn: { contains: search } },
          { descriptionEn: { contains: search } },
        ],
      }),
    }

    const [rawItems, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: ((page ?? 1) - 1) * (limit ?? 12),
        take: limit,
        include: { uploadedBy: { select: { fullName: true } } },
      }),
      prisma.content.count({ where }),
    ])

    // Never expose paywalled media URLs in catalog listings
    const items = rawItems.map((item) => stripMediaForList(item))

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / (limit ?? 12)), limit })
  } catch (error) {
    console.error("GET /api/content error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    if (["youtubeUrl", "pdfUrl", "gifUrl", "thumbnailUrl", "fileUrls"].some((key) => typeof body?.[key] === "string" && body[key].trim())) {
      return NextResponse.json({ error: "Les médias doivent être importés via le pipeline sécurisé Drive" }, { status: 400 })
    }
    const parsed = createContentSchema.safeParse({ ...body, status: "DRAFT" })
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const priceMillis = parsed.data.isFree
      ? null
      : parsed.data.priceMillis ?? (parsed.data.price == null ? 0 : Math.round(parsed.data.price * 1_000))
    if (!parsed.data.isFree && (priceMillis == null || !Number.isSafeInteger(priceMillis) || priceMillis <= 0)) {
      return NextResponse.json({ error: "Un contenu payant doit avoir un prix positif" }, { status: 400 })
    }
    const data = parsed.data
    const titleAr = data.titleAr || (data.primaryLanguage === "AR" ? data.displayTitle : "")
    const titleFr = data.titleFr || (data.primaryLanguage === "FR" ? data.displayTitle : "")
    const titleEn = data.titleEn || (data.primaryLanguage === "EN" ? data.displayTitle : undefined)
    const content = await prisma.content.create({
      data: {
        displayTitle: data.displayTitle,
        primaryLanguage: data.primaryLanguage,
        titleAr,
        titleFr,
        titleEn,
        descriptionAr: data.descriptionAr,
        descriptionFr: data.descriptionFr,
        descriptionEn: data.descriptionEn,
        grade: data.grade || "",
        subject: data.subject || "",
        contentType: data.contentType,
        language: data.language === "MULTI" ? data.primaryLanguage : data.language,
        audience: data.audience,
        category: data.category,
        collectionKey: data.collectionKey,
        storyKey: data.storyKey,
        editionLabel: data.editionLabel,
        isFree: data.isFree,
        priceMillis,
        price: priceMillis == null ? null : priceMillis / 1_000,
        status: "DRAFT",
        uploadedById: session.user.id,
      },
    })
    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error("POST /api/content error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
