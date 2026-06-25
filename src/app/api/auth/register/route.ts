import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { fullName, email, password, phone, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Un compte avec cet email existe déjà" }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { fullName, email, passwordHash, phone, role } })

    sendWelcomeEmail(email, fullName).catch(console.error)

    return NextResponse.json({ message: "Compte créé avec succès", userId: user.id }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
