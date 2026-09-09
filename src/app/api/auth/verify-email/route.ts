import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashOpaqueToken } from "@/lib/security-crypto"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token = body && typeof body.token === "string" ? body.token : ""
  if (!token) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 })

  const record = await prisma.oneTimeToken.findFirst({
    where: { purpose: "EMAIL_VERIFY", tokenHash: hashOpaqueToken(token), consumedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  })
  if (!record) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 })

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.oneTimeToken.update({ where: { id: record.id }, data: { consumedAt: now } })
    await tx.user.update({ where: { id: record.userId }, data: { emailVerified: now } })
  })
  await sendWelcomeEmail(record.user.email, record.user.fullName, record.user.id)
  return NextResponse.json({ ok: true, message: "Adresse email confirmée" })
}
