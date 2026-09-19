import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

const querySchema = z.object({
  status: z.enum(["DRAFT", "PROCESSING", "READY_FOR_REVIEW", "PUBLISHED", "ARCHIVED", "REJECTED"]).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
  if (!parsed.success) return NextResponse.json({ error: "Filtres invalides" }, { status: 400 })
  const { status, search, page, limit } = parsed.data
  const where = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { displayTitle: { contains: search, mode: "insensitive" as const } },
        { titleFr: { contains: search, mode: "insensitive" as const } },
        { titleAr: { contains: search, mode: "insensitive" as const } },
        { titleEn: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, displayTitle: true, primaryLanguage: true, titleAr: true, titleFr: true, titleEn: true,
        grade: true, subject: true, contentType: true, language: true, audience: true, category: true,
        isFree: true, priceMillis: true, status: true, createdAt: true, updatedAt: true,
        assets: { select: { id: true, kind: true, status: true, assetRole: true, failureReason: true, pageCount: true } },
      },
    }),
    prisma.content.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) }, { headers: { "Cache-Control": "private, no-store" } })
}
