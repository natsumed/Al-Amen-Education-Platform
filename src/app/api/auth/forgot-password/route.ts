import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validations"
import { sendPasswordResetEmail } from "@/lib/email"
import { forgotPasswordLimiter } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
    const limit = forgotPasswordLimiter.check(ip)
    if (!limit.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (!user) return NextResponse.json({ message: "Si cet email existe, un lien a été envoyé" })

    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExp: expiry } })
    await sendPasswordResetEmail(user.email, user.fullName, token)

    // Log reset link for local testing (Resend not configured in dev)
    console.log(`\n[DEV] Password reset link: http://localhost:3000/reset-password?token=${token}\n`)

    return NextResponse.json({ message: "Si cet email existe, un lien a été envoyé" })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
