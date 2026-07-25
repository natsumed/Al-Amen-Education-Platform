import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateContentSchema } from "@/lib/validations"
import { getContentAccessInfo } from "@/lib/access-control"
import { sanitizeContentForAccess } from "@/lib/content-media"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(req)
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: { select: { fullName: true } },
        reviews: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
      },
    })
    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const access = await getContentAccessInfo(user?.id || null, user?.role || null, params.id)
    const safe = sanitizeContentForAccess(content, access.canAccess)

    return NextResponse.json({ ...safe, access, mediaLocked: !access.canAccess })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateContentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const content = await prisma.content.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(content)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.content.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Supprimé" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
