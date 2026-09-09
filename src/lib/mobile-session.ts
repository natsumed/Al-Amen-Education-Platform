import { prisma } from "@/lib/prisma"
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security-crypto"
import { MOBILE_ACCESS_TTL_SECONDS, MOBILE_REFRESH_TTL_SECONDS, signMobileToken } from "@/lib/mobile-auth"
import type { Role } from "@/types"

export type MobileDeviceInput = { deviceId: string; platform: string; deviceName?: string | null }

export async function issueMobileSession(user: { id: string; email: string; role: string; fullName: string; publicId: string; avatarUrl: string | null; sessionVersion: number }, device: MobileDeviceInput) {
  const existing = await prisma.deviceSession.findUnique({ where: { userId_deviceId: { userId: user.id, deviceId: device.deviceId } } })
  if (!existing && await prisma.deviceSession.count({ where: { userId: user.id, revokedAt: null } }) >= 3) {
    throw new Error("DEVICE_LIMIT")
  }
  const deviceSession = await prisma.deviceSession.upsert({
    where: { userId_deviceId: { userId: user.id, deviceId: device.deviceId } },
    update: { platform: device.platform, deviceName: device.deviceName, lastSeenAt: new Date(), revokedAt: null },
    create: { userId: user.id, ...device },
  })
  const refreshToken = generateOpaqueToken()
  await prisma.refreshToken.create({ data: { deviceSessionId: deviceSession.id, tokenHash: hashOpaqueToken(refreshToken), expiresAt: new Date(Date.now() + MOBILE_REFRESH_TTL_SECONDS * 1000) } })
  const accessToken = await signMobileToken({ sub: user.id, email: user.email, role: user.role as Role, fullName: user.fullName, deviceSessionId: deviceSession.id, sessionVersion: user.sessionVersion })
  return { accessToken, token: accessToken, refreshToken, expiresIn: MOBILE_ACCESS_TTL_SECONDS, user: { id: user.id, publicId: user.publicId, email: user.email, fullName: user.fullName, role: user.role, avatarUrl: user.avatarUrl } }
}
