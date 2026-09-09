import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/prisma"
import { generatePublicId } from "@/lib/user-id"
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security-crypto"
import { MOBILE_ACCESS_TTL_SECONDS, MOBILE_REFRESH_TTL_SECONDS, signMobileToken } from "@/lib/mobile-auth"
import type { Role } from "@/types"
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

    const existingExternal = await prisma.externalAccount.findUnique({ where: { provider_providerAccountId: { provider: "google", providerAccountId: payload.sub } }, include: { user: true } })
    let user = existingExternal?.user || await prisma.user.findUnique({ where: { email: payload.email.trim().toLowerCase() } })
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
        const created = await tx.user.create({ data: { email: payload.email!.trim().toLowerCase(), fullName: payload.name || "Google User", googleId: payload.sub, avatarUrl: payload.picture, emailVerified: new Date(), role: "STUDENT", publicId } })
        await tx.externalAccount.create({ data: { provider: "google", providerAccountId: payload.sub!, userId: created.id, emailAtLink: created.email, lastLoginAt: new Date() } })
        return created
      })
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user!.id }, data: { emailVerified: user!.emailVerified ?? new Date(), avatarUrl: payload.picture || user!.avatarUrl, googleId: user!.googleId || payload.sub } })
        await tx.externalAccount.upsert({ where: { provider_providerAccountId: { provider: "google", providerAccountId: payload.sub! } }, update: { userId: user!.id, emailAtLink: user!.email, lastLoginAt: new Date(), revokedAt: null }, create: { provider: "google", providerAccountId: payload.sub!, userId: user!.id, emailAtLink: user!.email, lastLoginAt: new Date() } })
      })
    }

    const activeDevices = await prisma.deviceSession.count({ where: { userId: user.id, revokedAt: null } })
    const existingDevice = await prisma.deviceSession.findUnique({ where: { userId_deviceId: { userId: user.id, deviceId: device.deviceId } } })
    if (!existingDevice && activeDevices >= 3) return NextResponse.json({ error: "Limite de trois appareils atteinte", code: "DEVICE_LIMIT" }, { status: 403 })
    const session = await prisma.deviceSession.upsert({ where: { userId_deviceId: { userId: user.id, deviceId: device.deviceId } }, update: { platform: device.platform, deviceName: device.deviceName, lastSeenAt: new Date(), revokedAt: null }, create: { userId: user.id, ...device } })
    const refreshToken = generateOpaqueToken()
    await prisma.refreshToken.create({ data: { deviceSessionId: session.id, tokenHash: hashOpaqueToken(refreshToken), expiresAt: new Date(Date.now() + MOBILE_REFRESH_TTL_SECONDS * 1000) } })
    const accessToken = await signMobileToken({ sub: user.id, email: user.email, role: user.role as Role, fullName: user.fullName, deviceSessionId: session.id, sessionVersion: user.sessionVersion })
    return NextResponse.json({ accessToken, token: accessToken, refreshToken, expiresIn: MOBILE_ACCESS_TTL_SECONDS, user: { id: user.id, publicId: user.publicId, email: user.email, fullName: user.fullName, role: user.role, avatarUrl: user.avatarUrl } }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Mobile Google login error", error instanceof Error ? error.message : "unknown")
    return NextResponse.json({ error: "Google login indisponible" }, { status: 401 })
  }
}
