import { NextRequest, NextResponse } from "next/server"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import { generatePublicId } from "@/lib/user-id"
import { issueMobileSession } from "@/lib/mobile-session"
import { verifyMfaCode } from "@/lib/mfa"

const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"))

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null
    const identityToken = typeof body?.identityToken === "string" ? body.identityToken : ""
    const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : ""
    const platform = typeof body?.platform === "string" ? body.platform.toLowerCase() : ""
    if (!identityToken || !/^[A-Za-z0-9._:-]{8,160}$/.test(deviceId) || platform !== "ios") return NextResponse.json({ error: "Jeton Apple ou appareil invalide" }, { status: 400 })
    const audience = process.env.APPLE_CLIENT_ID || process.env.MOBILE_APPLE_BUNDLE_ID
    if (!audience) return NextResponse.json({ error: "Apple login non configuré" }, { status: 503 })
    const verified = await jwtVerify(identityToken, appleKeys, { issuer: "https://appleid.apple.com", audience })
    const subject = typeof verified.payload.sub === "string" ? verified.payload.sub : ""
    const email = typeof verified.payload.email === "string" ? verified.payload.email.trim().toLowerCase() : ""
    if (!subject) return NextResponse.json({ error: "Jeton Apple invalide" }, { status: 401 })
    const external = await prisma.externalAccount.findUnique({ where: { provider_providerAccountId: { provider: "apple", providerAccountId: subject } }, include: { user: true } })
    let user = external?.user || (email ? await prisma.user.findUnique({ where: { email } }) : null)
    if (user?.isBanned) return NextResponse.json({ error: "Compte suspendu" }, { status: 403 })
    if (user?.role === "ADMIN") return NextResponse.json({ error: "Les administrateurs utilisent le web", code: "ADMIN_WEB_ONLY" }, { status: 403 })
    if (user?.role === "TEACHER" && !external) return NextResponse.json({ error: "Associez Apple depuis le compte enseignant avec MFA", code: "TEACHER_LINK_REQUIRED" }, { status: 403 })
    if (user?.role === "TEACHER") {
      const totpCode = typeof body?.totpCode === "string" ? body.totpCode : ""
      if (!totpCode || !(await verifyMfaCode(user.id, totpCode))) return NextResponse.json({ error: "Code MFA requis", code: "MFA_REQUIRED" }, { status: 401 })
    }
    if (!user) {
      if (!email) return NextResponse.json({ error: "Apple doit fournir un email lors de la première connexion" }, { status: 400 })
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({ data: { email, fullName: "Apple User", emailVerified: new Date(), role: "STUDENT", publicId: await generatePublicId() } })
        await tx.externalAccount.create({ data: { provider: "apple", providerAccountId: subject, userId: created.id, emailAtLink: email, lastLoginAt: new Date() } })
        return created
      })
    } else {
      await prisma.externalAccount.upsert({ where: { provider_providerAccountId: { provider: "apple", providerAccountId: subject } }, update: { userId: user.id, emailAtLink: email || user.email, lastLoginAt: new Date(), revokedAt: null }, create: { provider: "apple", providerAccountId: subject, userId: user.id, emailAtLink: email || user.email, lastLoginAt: new Date() } })
    }
    const result = await issueMobileSession(user, { deviceId, platform, deviceName: typeof body?.deviceName === "string" ? body.deviceName : null })
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    const code = error instanceof Error ? error.message : "APPLE_LOGIN_FAILED"
    return NextResponse.json({ error: code === "DEVICE_LIMIT" ? "Limite de trois appareils atteinte" : "Apple login indisponible", code }, { status: code === "DEVICE_LIMIT" ? 403 : 401 })
  }
}
