import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { parentLinkRespondSchema } from "@/lib/validations"

/** Student responds to a parent link invitation */
export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = parentLinkRespondSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    const link = await prisma.parentLink.findUnique({ where: { id: parsed.data.linkId } })
    if (!link || link.studentId !== user.id) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 })
    }
    if (link.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation déjà traitée" }, { status: 409 })
    }

    const status = parsed.data.action === "ACCEPT" ? "ACCEPTED" : "REJECTED"
    const updated = await prisma.parentLink.update({
      where: { id: link.id },
      data: { status },
      include: { parent: { select: { fullName: true, email: true } } },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

/** List pending invitations for the logged-in student */
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ invitations: [] })
    }

    const invitations = await prisma.parentLink.findMany({
      where: { studentId: user.id, status: "PENDING" },
      include: { parent: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ invitations })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
