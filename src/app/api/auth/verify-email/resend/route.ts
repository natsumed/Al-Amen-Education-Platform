import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { forgotPasswordLimiter } from "@/lib/rate-limit"
import { hashOpaqueToken } from "@/lib/security-crypto"
import { sendVerificationEmail } from "@/lib/email"

function pendingEmail(req: NextRequest) {
  const bodyEmail = "" // body is parsed by the route below
  const encoded = req.cookies.get("amenallah_pending_verification")?.value
  if (!encoded) return bodyEmail
  try {
    return Buffer.from(encoded, "base64url").toString("utf8").trim().toLowerCase()
  } catch {
    return bodyEmail
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = await forgotPasswordLimiter.check(`verify:${ip}`)
  if (!limit.allowed) return NextResponse.json({ message: "Si le compte existe, un email a été envoyé" })
  const body = await req.json().catch(() => null)
  const email = body && typeof body.email === "string" && body.email.trim()
    ? body.email.trim().toLowerCase()
    : pendingEmail(req)
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
