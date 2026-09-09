import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { forgotPasswordLimiter } from "@/lib/rate-limit"
import { hashOpaqueToken } from "@/lib/security-crypto"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = await forgotPasswordLimiter.check(`verify:${ip}`)
  if (!limit.allowed) return NextResponse.json({ message: "Si le compte existe, un email a été envoyé" })
  const body = await req.json().catch(() => null)
  const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user && !user.emailVerified) {
      const token = crypto.randomBytes(32).toString("hex")
      await prisma.$transaction(async (tx) => {
        await tx.oneTimeToken.updateMany({ where: { userId: user.id, purpose: "EMAIL_VERIFY", consumedAt: null, revokedAt: null }, data: { revokedAt: new Date() } })
        await tx.oneTimeToken.create({ data: { userId: user.id, purpose: "EMAIL_VERIFY", tokenHash: hashOpaqueToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) } })
      })
      await sendVerificationEmail(user.email, user.fullName, token, user.id)
    }
  }
  return NextResponse.json({ message: "Si le compte existe, un email a été envoyé" })
}
