import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { sendWelcomeEmail } from "@/lib/email"
import { registerLimiter } from "@/lib/rate-limit"
import { generatePublicId, resolveUserByIdentifier } from "@/lib/user-id"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
    const limit = registerLimiter.check(ip)
    if (!limit.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { fullName, email, password, phone, role, studentPublicId } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Un compte avec cet email existe déjà" }, { status: 409 })

    let studentToLink: { id: string } | null = null
    if (role === "PARENT" && studentPublicId) {
      const student = await resolveUserByIdentifier(studentPublicId)
      if (!student || student.role !== "STUDENT") {
        return NextResponse.json(
          { error: "Aucun élève trouvé avec ce n° compte (8 chiffres)." },
          { status: 400 }
        )
      }
      studentToLink = { id: student.id }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const publicId = await generatePublicId()
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, phone, role, publicId },
    })

    let linkPending = false
    if (studentToLink) {
      try {
        await prisma.parentLink.create({
          data: {
            parentId: user.id,
            studentId: studentToLink.id,
            status: "PENDING",
          },
        })
        linkPending = true
      } catch {
        return NextResponse.json(
          {
            error: "Compte créé mais le lien parent–élève existe déjà ou a échoué.",
            userId: user.id,
            publicId: user.publicId,
          },
          { status: 409 }
        )
      }
    }

    sendWelcomeEmail(email, fullName).catch(console.error)

    registerLimiter.reset(ip)
    return NextResponse.json(
      {
        message: linkPending
          ? "Compte créé — invitation envoyée à l'élève (en attente d'acceptation)"
          : "Compte créé avec succès",
        userId: user.id,
        publicId: user.publicId,
        linkPending,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
