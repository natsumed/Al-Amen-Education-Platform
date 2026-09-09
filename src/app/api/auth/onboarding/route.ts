import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { socialOnboardingSchema } from "@/lib/validations"
import { resolveUserByIdentifier } from "@/lib/user-id"

const userSelect = {
  id: true,
  publicId: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  phone: true,
  preferredLanguage: true,
  onboardingCompletedAt: true,
} as const

export async function GET(req: NextRequest) {
  const requestUser = await getRequestUser(req, { allowPending: true })
  if (!requestUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [user, mfa] = await Promise.all([
    prisma.user.findUnique({ where: { id: requestUser.id }, select: userSelect }),
    prisma.mfaCredential.findUnique({ where: { userId: requestUser.id }, select: { enabledAt: true } }),
  ])
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ user, mfaEnabled: Boolean(mfa?.enabledAt) }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(req: NextRequest) {
  const requestUser = await getRequestUser(req, { allowPending: true })
  if (!requestUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = socialOnboardingSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const current = await prisma.user.findUnique({ where: { id: requestUser.id }, select: { id: true, role: true, isBanned: true } })
  if (!current || current.isBanned) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (current.role !== "PENDING") return NextResponse.json({ error: "Onboarding déjà terminé" }, { status: 409 })

  const input = parsed.data
  if (input.role === "TEACHER") {
    const mfa = await prisma.mfaCredential.findUnique({ where: { userId: current.id }, select: { enabledAt: true } })
    if (!mfa?.enabledAt) return NextResponse.json({ error: "Configurez la double authentification avant de devenir enseignant", code: "MFA_ENROLLMENT_REQUIRED" }, { status: 403 })
  }

  let studentId: string | null = null
  if (input.role === "PARENT" && input.studentPublicId) {
    const student = await resolveUserByIdentifier(input.studentPublicId)
    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Aucun élève trouvé avec ce n° compte" }, { status: 400 })
    }
    studentId = student.id
  }

  try {
    const completed = await prisma.$transaction(async (tx) => {
      if (studentId) {
        const existing = await tx.parentLink.findUnique({ where: { parentId_studentId: { parentId: current.id, studentId } } })
        if (!existing) await tx.parentLink.create({ data: { parentId: current.id, studentId, status: "PENDING" } })
      }
      const user = await tx.user.update({
        where: { id: current.id },
        data: {
          role: input.role,
          preferredLanguage: input.preferredLanguage,
          phone: input.phone || null,
          onboardingCompletedAt: new Date(),
        },
        select: userSelect,
      })
      await tx.auditEvent.create({ data: { userId: user.id, action: "SOCIAL_ONBOARDING_COMPLETED", targetType: "User", targetId: user.id, metadata: { role: input.role } } })
      return user
    })
    return NextResponse.json({ user: completed, linkPending: Boolean(studentId) }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Social onboarding error", error)
    return NextResponse.json({ error: "Impossible de terminer l'inscription" }, { status: 500 })
  }
}
