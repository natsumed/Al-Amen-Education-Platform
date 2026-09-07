import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { hash as hashArgon2, verify as verifyArgon2 } from "@node-rs/argon2"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { changePasswordSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const requestUser = await getRequestUser(req)
    if (!requestUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: requestUser.id },
      select: { id: true, passwordHash: true },
    })

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Ce compte n'a pas de mot de passe local (connexion Google)." },
        { status: 400 }
      )
    }

    const ok = user.passwordHash.startsWith("$argon2")
      ? await verifyArgon2(user.passwordHash, parsed.data.currentPassword)
      : await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
    }

    const passwordHash = await hashArgon2(parsed.data.newPassword)
    const now = new Date()
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordUpdatedAt: now, sessionVersion: { increment: 1 } },
      })
      const sessions = await tx.deviceSession.findMany({ where: { userId: user.id }, select: { id: true } })
      const ids = sessions.map((session) => session.id)
      await tx.deviceSession.updateMany({ where: { id: { in: ids } }, data: { revokedAt: now } })
      await tx.refreshToken.updateMany({ where: { deviceSessionId: { in: ids } }, data: { revokedAt: now } })
    })

    return NextResponse.json({ message: "Mot de passe mis à jour" })
  } catch (error) {
    console.error("POST /api/users/me/password error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
