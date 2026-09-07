import { SignJWT, jwtVerify } from "jose"

type DocumentGrant = {
  userId: string
  contentId: string
  assetId: string
  pages: number[]
}

function key() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not configured")
  return new TextEncoder().encode(secret)
}

export async function signDocumentGrant(grant: DocumentGrant) {
  return new SignJWT({ ...grant, purpose: "document-page" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .setJti(crypto.randomUUID())
    .sign(key())
}

export async function verifyDocumentGrant(token: string): Promise<DocumentGrant | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], typ: "JWT" })
    if (
      payload.purpose !== "document-page" ||
      typeof payload.userId !== "string" ||
      typeof payload.contentId !== "string" ||
      typeof payload.assetId !== "string" ||
      !Array.isArray(payload.pages) ||
      !payload.pages.every((page) => Number.isInteger(page))
    ) return null
    return {
      userId: payload.userId,
      contentId: payload.contentId,
      assetId: payload.assetId,
      pages: payload.pages as number[],
    }
  } catch {
    return null
  }
}
