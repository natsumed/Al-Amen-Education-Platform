import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import type { AuthUser } from "@/lib/request-auth"

export function nativeContentOnly() {
  return process.env.MOBILE_NATIVE_CONTENT_ONLY === "true"
}

/** Native content access is proven by a bearer-backed, non-revoked device session. */
export async function hasNativeContentSession(req: NextRequest, user: AuthUser) {
  if (!nativeContentOnly()) return true
  if (!req.headers.get("authorization")?.startsWith("Bearer ") || !user.deviceSessionId) return false
  const device = await prisma.deviceSession.findFirst({
    where: { id: user.deviceSessionId, userId: user.id, revokedAt: null, attestedAt: { not: null }, platform: { in: ["android", "ios"] } },
    select: { id: true },
  })
  return Boolean(device)
}
