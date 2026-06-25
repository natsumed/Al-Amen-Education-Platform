import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [totalUsers, totalContent, totalRevenue, activeSubscriptions, newUsersThisMonth, recentContent, contentByType] = await Promise.all([
      prisma.user.count(),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
      prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
      prisma.subscription.count({ where: { status: "ACTIVE", endDate: { gt: now } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.content.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, titleFr: true, contentType: true, createdAt: true } }),
      prisma.content.groupBy({ by: ["contentType"], _count: { contentType: true } }),
    ])

    const contentByTypeMap: Record<string, number> = {}
    contentByType.forEach(({ contentType, _count }) => { contentByTypeMap[contentType] = _count.contentType })

    return NextResponse.json({
      totalUsers,
      totalContent,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      activeSubscriptions,
      newUsersThisMonth,
      recentContent,
      contentByType: contentByTypeMap,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
