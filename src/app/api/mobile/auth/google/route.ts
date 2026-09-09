import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/prisma"
import { generatePublicId } from "@/lib/user-id"
import { issueMobileSession } from "@/lib/mobile-session"
import { verifyMfaCode } from "@/lib/mfa"

function deviceFrom(body: Record<string, unknown>) {
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : ""
  const platform = typeof body.platform === "string" ? body.platform.toLowerCase() : ""
  const deviceName = typeof body.deviceName === "string" ? body.deviceName.trim().slice(0, 120) : null
  if (!/^[A-Za-z0-9._:-]{8,160}$/.test(deviceId) || !["android", "ios"].includes(platform)) return null
  return { deviceId, platform, deviceName }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    const idToken = typeof body?.idToken === "string" ? body.idToken : ""
    const device = body ? deviceFrom(body) : null
    if (!idToken || !device) return NextResponse.json({ error: "Jeton Google ou appareil invalide" }, { status: 400 })

    const audiences = [process.env.AUTH_GOOGLE_ID, process.env.GOOGLE_ANDROID_CLIENT_ID, process.env.GOOGLE_IOS_CLIENT_ID].filter(Boolean) as string[]
    if (!audiences.length) return NextResponse.json({ error: "Google login non configuré" }, { status: 503 })
    const ticket = await new OAuth2Client().verifyIdToken({ idToken, audience: audiences })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || payload.email_verified !== true) return NextResponse.json({ error: "Compte Google non vérifié" }, { status: 401 })

    const email = payload.email.trim().toLowerCase()
    const existingExternal = await prisma.externalAccount.findUnique({ where: { provider_providerAccountId: { provider: "google", providerAccountId: payload.sub } }, include: { user: true } })
    if (existingExternal?.revokedAt) return NextResponse.json({ error: "Connexion Google révoquée", code: "EXTERNAL_ACCOUNT_REVOKED" }, { status: 403 })
    if (existingExternal && existingExternal.user.email !== email) {
      return NextResponse.json({ error: "Compte Google incohérent", code: "EXTERNAL_ACCOUNT_CONFLICT" }, { status: 403 })
    }
    let user = existingExternal?.user || await prisma.user.findUnique({ where: { email } })
    if (user?.isBanned) return NextResponse.json({ error: "Compte suspendu" }, { status: 403 })
    if (user?.role === "ADMIN") return NextResponse.json({ error: "Les administrateurs utilisent le web", code: "ADMIN_WEB_ONLY" }, { status: 403 })
    if (user?.role === "TEACHER" && !existingExternal) return NextResponse.json({ error: "Associez Google depuis le compte enseignant avec MFA", code: "TEACHER_LINK_REQUIRED" }, { status: 403 })
    if (user?.role === "TEACHER") {
      const totpCode = typeof body?.totpCode === "string" ? body.totpCode : ""
      if (!totpCode || !(await verifyMfaCode(user.id, totpCode))) return NextResponse.json({ error: "Code MFA requis", code: "MFA_REQUIRED" }, { status: 401 })
    }

    if (!user) {
      const publicId = await generatePublicId()
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({ data: { email, fullName: payload.name || "Google User", googleId: payload.sub, avatarUrl: payload.picture, emailVerified: new Date(), role: "PENDING", publicId } })
        await tx.externalAccount.create({ data: { provider: "google", providerAccountId: payload.sub!, userId: created.id, emailAtLink: created.email, lastLoginAt: new Date() } })
        return created
      })
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user!.id }, data: { emailVerified: user!.emailVerified ?? new Date(), avatarUrl: payload.picture || user!.avatarUrl, googleId: user!.googleId || payload.sub } })
        await tx.externalAccount.upsert({ where: { provider_providerAccountId: { provider: "google", providerAccountId: payload.sub! } }, update: { userId: user!.id, emailAtLink: user!.email, lastLoginAt: new Date(), revokedAt: null }, create: { provider: "google", providerAccountId: payload.sub!, userId: user!.id, emailAtLink: user!.email, lastLoginAt: new Date() } })
      })
    }

    const session = await issueMobileSession(user, device)
    return NextResponse.json({ ...session, onboardingRequired: user.role === "PENDING" }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Mobile Google login error", error instanceof Error ? error.message : "unknown")
    return NextResponse.json({ error: "Google login indisponible" }, { status: 401 })
  }
}
