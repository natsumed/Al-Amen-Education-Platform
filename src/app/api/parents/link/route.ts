import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { parentLinkSchema } from "@/lib/validations"
import { resolveUserByIdentifier } from "@/lib/user-id"

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user || user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = parentLinkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Email ou n° compte élève invalide" }, { status: 400 })
    }

    const identifier = parsed.data.childIdentifier || parsed.data.childEmail || ""
    const child = await resolveUserByIdentifier(identifier)
    if (!child) {
      return NextResponse.json({ error: "Aucun compte trouvé" }, { status: 404 })
    }
    if (child.role !== "STUDENT") {
      return NextResponse.json({ error: "Cet utilisateur n'est pas un élève" }, { status: 400 })
    }

    const existing = await prisma.parentLink.findUnique({
      where: { parentId_studentId: { parentId: user.id, studentId: child.id } },
    })
    if (existing) {
      return NextResponse.json({ error: "Lien déjà existant" }, { status: 409 })
    }

    const link = await prisma.parentLink.create({
      data: { parentId: user.id, studentId: child.id, status: "PENDING" },
    })
    return NextResponse.json(link, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
