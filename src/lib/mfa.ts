import * as OTPAuth from "otpauth"
import { prisma } from "./prisma"
import { decryptSecret, encryptSecret, generateOpaqueToken } from "./security-crypto"

function totp(secret: string, label: string) {
  return new OTPAuth.TOTP({ issuer: "Amenallah Edition", label, algorithm: "SHA1", digits: 6, period: 30, secret })
}

export function createTotpEnrollment(label: string) {
  const secret = new OTPAuth.Secret({ size: 20 }).base32
  return { secret, uri: totp(secret, label).toString() }
}

export async function verifyMfaCode(userId: string, codeInput: string): Promise<boolean> {
  const credential = await prisma.mfaCredential.findUnique({ where: { userId } })
  if (!credential?.enabledAt) return false
  const code = codeInput.replace(/[\s-]/g, "").toUpperCase()
  const secret = decryptSecret(credential.secretEncrypted)
  const generator = totp(secret, userId)
  const delta = /^\d{6}$/.test(code) ? generator.validate({ token: code, window: 1 }) : null

  if (delta !== null) {
    const counter = BigInt(generator.counter() + delta)
    const updated = await prisma.mfaCredential.updateMany({
      where: {
        id: credential.id,
        OR: [{ lastUsedCounter: null }, { lastUsedCounter: { lt: counter } }],
      },
      data: { lastUsedCounter: counter },
    })
    return updated.count === 1
  }

  if (!credential.recoveryCodesEncrypted) return false
  const recovery = JSON.parse(decryptSecret(credential.recoveryCodesEncrypted)) as string[]
  const index = recovery.indexOf(code)
  if (index < 0) return false
  recovery.splice(index, 1)
  const updated = await prisma.mfaCredential.updateMany({
    where: { id: credential.id, recoveryCodesEncrypted: credential.recoveryCodesEncrypted },
    data: { recoveryCodesEncrypted: encryptSecret(JSON.stringify(recovery)) },
  })
  return updated.count === 1
}

export function generateRecoveryCodes() {
  return Array.from({ length: 8 }, () => generateOpaqueToken(8).replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase())
}
