import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id }
    const url = new URL(req.url)
    const page = Number(url.searchParams.get("page") || 1)
    const limit = 20

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ])

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
