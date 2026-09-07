import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { verify as verifyArgon2, hash as hashArgon2 } from "@node-rs/argon2"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations"
import {
  MOBILE_ACCESS_TTL_SECONDS,
  MOBILE_REFRESH_TTL_SECONDS,
  signMobileToken,
} from "@/lib/mobile-auth"
import { generateOpaqueToken, hashNetworkIdentifier, hashOpaqueToken } from "@/lib/security-crypto"
import { loginLimiter } from "@/lib/rate-limit"
import type { Role } from "@/types"
import { verifyMfaCode } from "@/lib/mfa"

function normalizedDevice(body: unknown, req: NextRequest, email: string) {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {}
  const supplied = typeof input.deviceId === "string" ? input.deviceId.trim() : ""
  const deviceId = /^[A-Za-z0-9._:-]{8,160}$/.test(supplied)
    ? supplied
    : `legacy-${hashNetworkIdentifier(`${email}:${req.headers.get("user-agent") || "unknown"}`).slice(0, 32)}`
  const rawPlatform = typeof input.platform === "string" ? input.platform.toLowerCase() : "unknown"
  const platform = ["android", "ios"].includes(rawPlatform) ? rawPlatform : "unknown"
  const deviceName = typeof input.deviceName === "string" ? input.deviceName.trim().slice(0, 120) : null
  return { deviceId, platform, deviceName }
}

async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  if (passwordHash.startsWith("$argon2")) return verifyArgon2(passwordHash, password)
  return bcrypt.compare(password, passwordHash)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : body?.email
    const parsed = loginSchema.safeParse({ ...body, email: rawEmail })
    if (!parsed.success) {
      return NextResponse.json({ error: "Email ou mot de passe invalide" }, { status: 400 })
    }

    const { email, password } = parsed.data
    const limit = await loginLimiter.check(email)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
      )
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { mfaCredential: true } })
    if (!user?.passwordHash || user.isBanned || !(await verifyPassword(user.passwordHash, password))) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 })
    }

    const mfaEnabled = Boolean(user.mfaCredential?.enabledAt)
    if (["ADMIN", "TEACHER"].includes(user.role) && !mfaEnabled) {
      return NextResponse.json({ error: "Configurez d'abord la double authentification sur le site", code: "MFA_ENROLLMENT_REQUIRED" }, { status: 403 })
    }
    if (mfaEnabled) {
      const code = typeof body?.totpCode === "string" ? body.totpCode : ""
      if (!code || !(await verifyMfaCode(user.id, code))) {
        return NextResponse.json({ error: "Code de sécurité invalide", code: "MFA_REQUIRED" }, { status: 401 })
      }
    }

    await loginLimiter.reset(email)

    if (!user.passwordHash.startsWith("$argon2")) {
      const upgraded = await hashArgon2(password)
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: upgraded, passwordUpdatedAt: new Date() },
      })
    }

    const device = normalizedDevice(body, req, email)
    const existing = await prisma.deviceSession.findUnique({
      where: { userId_deviceId: { userId: user.id, deviceId: device.deviceId } },
    })
    if (!existing) {
      const activeCount = await prisma.deviceSession.count({
        where: { userId: user.id, revokedAt: null },
      })
      if (activeCount >= 3) {
        return NextResponse.json(
          { error: "Limite de trois appareils atteinte", code: "DEVICE_LIMIT" },
          { status: 403 }
        )
      }
    }

    const deviceSession = await prisma.deviceSession.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId: device.deviceId } },
      update: {
        platform: device.platform,
        deviceName: device.deviceName,
        lastSeenAt: new Date(),
        revokedAt: null,
      },
      create: { userId: user.id, ...device },
    })

    const refreshToken = generateOpaqueToken()
    await prisma.refreshToken.create({
      data: {
        deviceSessionId: deviceSession.id,
        tokenHash: hashOpaqueToken(refreshToken),
        expiresAt: new Date(Date.now() + MOBILE_REFRESH_TTL_SECONDS * 1000),
      },
    })

    const accessToken = await signMobileToken({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      fullName: user.fullName,
      deviceSessionId: deviceSession.id,
      sessionVersion: user.sessionVersion,
    })

    return NextResponse.json({
      accessToken,
      token: accessToken,
      refreshToken,
      expiresIn: MOBILE_ACCESS_TTL_SECONDS,
      user: {
        id: user.id,
        publicId: user.publicId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Mobile login error", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
