import { NextRequest, NextResponse } from "next/server"
import { hash as hashArgon2 } from "@node-rs/argon2"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validations"
import { hashOpaqueToken } from "@/lib/security-crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

    const { token, password } = parsed.data
    const user = await prisma.user.findFirst({ where: { resetToken: hashOpaqueToken(token), resetTokenExp: { gt: new Date() } } })
    if (!user) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 })

    const passwordHash = await hashArgon2(password)
    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordUpdatedAt: now,
          sessionVersion: { increment: 1 },
          resetToken: null,
          resetTokenExp: null,
        },
      })
      const sessions = await tx.deviceSession.findMany({ where: { userId: user.id }, select: { id: true } })
      const ids = sessions.map((session) => session.id)
      await tx.deviceSession.updateMany({ where: { id: { in: ids } }, data: { revokedAt: now } })
      await tx.refreshToken.updateMany({ where: { deviceSessionId: { in: ids } }, data: { revokedAt: now } })
    })

    return NextResponse.json({ message: "Mot de passe réinitialisé avec succès" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
