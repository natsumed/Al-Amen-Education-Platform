import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const url = new URL(req.url)
    const search = url.searchParams.get("search") || ""
    const page = Number(url.searchParams.get("page") || 1)
    const limit = 20

    const where = search ? {
      OR: [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, fullName: true, email: true, role: true, isBanned: true, createdAt: true, avatarUrl: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
