import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

    const { token, password } = parsed.data
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetTokenExp: { gt: new Date() } } })
    if (!user) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, resetToken: null, resetTokenExp: null } })

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
