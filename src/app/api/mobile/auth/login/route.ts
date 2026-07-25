import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations"
import { signMobileToken } from "@/lib/mobile-auth"
import { loginLimiter } from "@/lib/rate-limit"
import type { Role } from "@/types"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Email ou mot de passe invalide" }, { status: 400, headers: corsHeaders })
    }

    const { email, password } = parsed.data
    const limit = loginLimiter.check(email)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: corsHeaders }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.passwordHash || user.isBanned) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401, headers: corsHeaders })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401, headers: corsHeaders })
    }

    loginLimiter.reset(email)

    const token = signMobileToken({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          publicId: user.publicId,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      },
      { headers: corsHeaders }
    )
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: corsHeaders })
  }
}
