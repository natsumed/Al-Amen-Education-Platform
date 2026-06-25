import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        isBanned: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        endDate: { gt: new Date() },
      },
      orderBy: { endDate: "desc" },
      select: {
        id: true,
        plan: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    })

    return NextResponse.json({ user, subscription })
  } catch (error) {
    console.error("GET /api/users/me error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
