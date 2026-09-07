import { SignJWT, jwtVerify } from "jose"
import type { Role } from "@/types"

export const MOBILE_ACCESS_TTL_SECONDS = 15 * 60
export const MOBILE_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60

export type MobileTokenPayload = {
  sub: string
  email: string
  role: Role
  fullName: string
  deviceSessionId: string
  sessionVersion: number
  exp: number
  iat: number
  jti: string
}

function signingKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not configured")
  return new TextEncoder().encode(secret)
}

export async function signMobileToken(
  payload: Omit<MobileTokenPayload, "exp" | "iat" | "jti">
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName,
    deviceSessionId: payload.deviceSessionId,
    sessionVersion: payload.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MOBILE_ACCESS_TTL_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(signingKey())
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      algorithms: ["HS256"],
      typ: "JWT",
    })
    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.deviceSessionId !== "string" ||
      typeof payload.sessionVersion !== "number" ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      typeof payload.jti !== "string"
    ) return null

    return payload as unknown as MobileTokenPayload
  } catch {
    return null
  }
}

export function getBearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const [scheme, token, extra] = authorization.trim().split(/\s+/)
  if (scheme?.toLowerCase() !== "bearer" || !token || extra) return null
  return token
}
