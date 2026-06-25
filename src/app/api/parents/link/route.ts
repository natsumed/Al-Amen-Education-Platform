import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parentLinkSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "PARENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const parsed = parentLinkSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 })

    const child = await prisma.user.findUnique({ where: { email: parsed.data.childEmail } })
    if (!child) return NextResponse.json({ error: "Aucun compte trouvé avec cet email" }, { status: 404 })
    if (child.role !== "STUDENT") return NextResponse.json({ error: "Cet utilisateur n'est pas un élève" }, { status: 400 })

    const existing = await prisma.parentLink.findUnique({ where: { parentId_studentId: { parentId: session.user.id, studentId: child.id } } })
    if (existing) return NextResponse.json({ error: "Lien déjà existant" }, { status: 409 })

    const link = await prisma.parentLink.create({ data: { parentId: session.user.id, studentId: child.id } })
    return NextResponse.json(link, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
