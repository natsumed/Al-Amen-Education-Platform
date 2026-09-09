import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations"
import { sendVerificationEmail } from "@/lib/email"
import { registerLimiter } from "@/lib/rate-limit"
import { generatePublicId, resolveUserByIdentifier } from "@/lib/user-id"
import crypto from "crypto"
import { hashOpaqueToken } from "@/lib/security-crypto"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
    const limit = await registerLimiter.check(ip)
    if (!limit.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { fullName, password, phone, role, studentPublicId } = parsed.data
    const email = parsed.data.email.trim().toLowerCase()

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

    const verificationToken = crypto.randomBytes(32).toString("hex")
    await prisma.$transaction(async (tx) => {
      await tx.oneTimeToken.updateMany({
        where: { userId: user.id, purpose: "EMAIL_VERIFY", consumedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      await tx.oneTimeToken.create({
        data: {
          userId: user.id,
          purpose: "EMAIL_VERIFY",
          tokenHash: hashOpaqueToken(verificationToken),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })
    })
    await sendVerificationEmail(email, fullName, verificationToken, user.id)

    await registerLimiter.reset(ip)
    return NextResponse.json(
      {
        message: linkPending
        ? "Compte créé — confirmez votre email; l'invitation est en attente d'acceptation"
          : "Compte créé — confirmez votre adresse email pour vous connecter",
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
