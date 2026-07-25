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
    const status = url.searchParams.get("status")
    const limit = 20

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          ...where,
          ...(status ? { status } : {}),
        },
        include: {
          user: { select: { fullName: true, email: true, publicId: true } },
          beneficiary: { select: { fullName: true, email: true, publicId: true, id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({
        where: {
          ...where,
          ...(status ? { status } : {}),
        },
      }),
    ])

    // Attach subscription period for successful payments (beneficiary or payer)
    const enriched = await Promise.all(
      items.map(async (p) => {
        if (p.status !== "SUCCESS") return { ...p, subscriptionPeriod: null }
        const targetUserId = p.beneficiaryUserId || p.userId
        const sub = await prisma.subscription.findFirst({
          where: { userId: targetUserId, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: { startDate: true, endDate: true, plan: true },
        })
        return { ...p, subscriptionPeriod: sub }
      })
    )

    return NextResponse.json({
      items: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
