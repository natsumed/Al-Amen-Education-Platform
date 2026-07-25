import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { adminUpdateUserSchema } from "@/lib/validations"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = adminUpdateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Never allow passwordHash / email / googleId / reset tokens via this endpoint
    const data = parsed.data
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucun champ valide" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const isSelf = session.user.id === params.id
    const isAdmin = session.user.role === "ADMIN"
    let isLinkedParent = false

    if (!isSelf && !isAdmin && session.user.role === "PARENT") {
      const link = await prisma.parentLink.findUnique({
        where: {
          parentId_studentId: { parentId: session.user.id, studentId: params.id },
        },
      })
      isLinkedParent = link?.status === "ACCEPTED"
    }

    if (!isSelf && !isAdmin && !isLinkedParent) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        isBanned: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: true,
        progress: {
          include: { content: { select: { id: true, titleFr: true, titleAr: true, contentType: true } } },
          take: 10,
          orderBy: { lastAccessed: "desc" },
        },
      },
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
