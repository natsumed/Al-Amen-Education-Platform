import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  MOBILE_ACCESS_TTL_SECONDS,
  MOBILE_REFRESH_TTL_SECONDS,
  signMobileToken,
} from "@/lib/mobile-auth"
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security-crypto"
import type { Role } from "@/types"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const rawToken = body && typeof body.refreshToken === "string" ? body.refreshToken : ""
  if (!rawToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashOpaqueToken(rawToken) },
    include: { deviceSession: { include: { user: true } } },
  })

  const now = new Date()
  if (!existing) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (existing.usedAt || existing.revokedAt) {
    await prisma.deviceSession.update({
      where: { id: existing.deviceSessionId },
      data: { revokedAt: now },
    }).catch(() => undefined)
    return NextResponse.json({ error: "Session révoquée", code: "TOKEN_REUSE" }, { status: 401 })
  }

  const { deviceSession } = existing
  const user = deviceSession.user
  if (existing.expiresAt <= now || deviceSession.revokedAt || user.isBanned) {
    return NextResponse.json({ error: "Session expirée" }, { status: 401 })
  }

  const nextRefreshToken = generateOpaqueToken()
  const rotated = await prisma.$transaction(async (tx) => {
    const consumed = await tx.refreshToken.updateMany({
      where: { id: existing.id, usedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    })
    if (consumed.count !== 1) throw new Error("REFRESH_REPLAY")
    await tx.deviceSession.update({
      where: { id: deviceSession.id },
      data: { lastSeenAt: now },
    })
    return tx.refreshToken.create({
      data: {
        deviceSessionId: deviceSession.id,
        tokenHash: hashOpaqueToken(nextRefreshToken),
        expiresAt: new Date(Date.now() + MOBILE_REFRESH_TTL_SECONDS * 1000),
      },
    })
  }).catch(() => null)

  if (!rotated) {
    await prisma.deviceSession.update({
      where: { id: deviceSession.id },
      data: { revokedAt: now },
    }).catch(() => undefined)
    return NextResponse.json({ error: "Session révoquée", code: "TOKEN_REUSE" }, { status: 401 })
  }

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
    refreshToken: nextRefreshToken,
    expiresIn: MOBILE_ACCESS_TTL_SECONDS,
  }, { headers: { "Cache-Control": "no-store" } })
}
