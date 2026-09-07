import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto"

function encryptionKey(): Buffer {
  const encoded = process.env.DATA_ENCRYPTION_KEY
  if (!encoded) throw new Error("DATA_ENCRYPTION_KEY is not configured")
  const key = Buffer.from(encoded, "base64")
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes encoded as base64")
  return key
}

export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptSecret(value: string): string {
  const [version, ivPart, tagPart, payloadPart] = value.split(".")
  if (version !== "v1" || !ivPart || !tagPart || !payloadPart) {
    throw new Error("Encrypted value is malformed")
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"))
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(payloadPart, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url")
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function hashNetworkIdentifier(value: string): string {
  const key = process.env.AUDIT_HASH_KEY || process.env.AUTH_SECRET
  if (!key) return "unavailable"
  return createHmac("sha256", key).update(value).digest("hex")
}
