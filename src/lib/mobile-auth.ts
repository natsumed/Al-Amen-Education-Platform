import { createHmac, timingSafeEqual } from "crypto"
import type { Role } from "@/types"

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export type MobileTokenPayload = {
  sub: string
  email: string
  role: Role
  fullName: string
  exp: number
  iat: number
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not configured")
  return secret
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input
  return buf.toString("base64url")
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input, "base64url")
}

export function signMobileToken(payload: Omit<MobileTokenPayload, "exp" | "iat">): string {
  const iat = Math.floor(Date.now() / 1000)
  const body: MobileTokenPayload = {
    ...payload,
    iat,
    exp: iat + TOKEN_TTL_SECONDS,
  }
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "MAT" }))
  const payloadPart = b64url(JSON.stringify(body))
  const data = `${header}.${payloadPart}`
  const sig = createHmac("sha256", getSecret()).update(data).digest()
  return `${data}.${b64url(sig)}`
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [header, payloadPart, sigPart] = parts
    const data = `${header}.${payloadPart}`
    const expected = createHmac("sha256", getSecret()).update(data).digest()
    const actual = fromB64url(sigPart)
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

    const payload = JSON.parse(fromB64url(payloadPart).toString("utf8")) as MobileTokenPayload
    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function getBearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const [scheme, token] = authorization.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}
