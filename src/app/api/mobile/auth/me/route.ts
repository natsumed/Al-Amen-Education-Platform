import { NextRequest, NextResponse } from "next/server"
import { getRequestUser } from "@/lib/request-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getRequestUser(req, { allowPending: true })
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        publicId: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        preferredLanguage: true,
        emailNotifications: true,
        subscriptions: {
          where: { status: "ACTIVE", endDate: { gt: new Date() } },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ user }, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
