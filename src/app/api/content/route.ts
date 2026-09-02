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

    const { grade, subject, contentType, isFree, search, page = 1, limit = 12 } = filters.data || {}

    // Keep filtering portable across the supported PostgreSQL deployment.
    const where: Record<string, unknown> = {
      status: "PUBLISHED",
      ...(grade && { grade }),
      ...(subject && { subject }),
      ...(contentType && { contentType }),
      ...(isFree !== undefined && { isFree }),
      ...(search && {
        OR: [
          { titleFr: { contains: search } },
          { titleAr: { contains: search } },
          { descriptionFr: { contains: search } },
          { descriptionAr: { contains: search } },
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
    const parsed = createContentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const content = await prisma.content.create({ data: { ...parsed.data, uploadedById: session.user.id } })
    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error("POST /api/content error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
