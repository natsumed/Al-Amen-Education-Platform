import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { updateProfileSchema } from "@/lib/validations"

const meSelect = {
  id: true,
  publicId: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  phone: true,
  isBanned: true,
  preferredLanguage: true,
  emailNotifications: true,
  createdAt: true,
} as const

export async function GET(req: NextRequest) {
  try {
    const requestUser = await getRequestUser(req)
    if (!requestUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: requestUser.id },
      select: meSelect,
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

export async function PATCH(req: NextRequest) {
  try {
    const requestUser = await getRequestUser(req)
    if (!requestUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const user = await prisma.user.update({
      where: { id: requestUser.id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.avatarUrl !== undefined
          ? { avatarUrl: data.avatarUrl === "" ? null : data.avatarUrl }
          : {}),
        ...(data.preferredLanguage !== undefined
          ? { preferredLanguage: data.preferredLanguage }
          : {}),
        ...(data.emailNotifications !== undefined
          ? { emailNotifications: data.emailNotifications }
          : {}),
      },
      select: meSelect,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("PATCH /api/users/me error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
