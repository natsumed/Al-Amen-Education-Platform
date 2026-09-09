import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validations"
import { sendPasswordResetEmail } from "@/lib/email"
import { forgotPasswordLimiter } from "@/lib/rate-limit"
import { hashOpaqueToken } from "@/lib/security-crypto"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
    const limit = await forgotPasswordLimiter.check(ip)
    if (!limit.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (!user) return NextResponse.json({ message: "Si cet email existe, un lien a été envoyé" })

    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 20 * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      await tx.oneTimeToken.updateMany({
        where: { userId: user.id, purpose: "PASSWORD_RESET", consumedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      await tx.oneTimeToken.create({
        data: {
          userId: user.id,
          purpose: "PASSWORD_RESET",
          tokenHash: hashOpaqueToken(token),
          expiresAt: expiry,
        },
      })
    })
    await sendPasswordResetEmail(user.email, user.fullName, token, user.id)

    // Log reset link for local testing (Resend not configured in dev)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Password reset token generated for ${user.id}`)
    }

    return NextResponse.json({ message: "Si cet email existe, un lien a été envoyé" })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
