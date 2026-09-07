import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { createTotpEnrollment, generateRecoveryCodes, verifyMfaCode } from "@/lib/mfa"
import { decryptSecret, encryptSecret } from "@/lib/security-crypto"
import * as OTPAuth from "otpauth"

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const credential = await prisma.mfaCredential.findUnique({ where: { userId: user.id }, select: { enabledAt: true, type: true } })
  return NextResponse.json({ required: ["ADMIN", "TEACHER"].includes(user.role), enabled: Boolean(credential?.enabledAt), type: credential?.type || null })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const existing = await prisma.mfaCredential.findUnique({ where: { userId: user.id } })
    if (existing?.enabledAt) {
      const body = await req.json().catch(() => ({}))
      const currentCode = typeof body.currentCode === "string" ? body.currentCode : ""
      if (!currentCode || !(await verifyMfaCode(user.id, currentCode))) {
        return NextResponse.json({ error: "Current MFA code required" }, { status: 403 })
      }
    }
    const enrollment = createTotpEnrollment(user.email)
    await prisma.mfaCredential.upsert({
      where: { userId: user.id },
      update: { type: "TOTP", secretEncrypted: encryptSecret(enrollment.secret), recoveryCodesEncrypted: null, enabledAt: null, lastUsedCounter: null },
      create: { userId: user.id, type: "TOTP", secretEncrypted: encryptSecret(enrollment.secret) },
    })
    return NextResponse.json(enrollment, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ error: "MFA encryption is not configured" }, { status: 503 })
  }
}

export async function PUT(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : ""
  const credential = await prisma.mfaCredential.findUnique({ where: { userId: user.id } })
  if (!credential || credential.enabledAt) return NextResponse.json({ error: "No pending enrollment" }, { status: 409 })
  const secret = decryptSecret(credential.secretEncrypted)
  const generator = new OTPAuth.TOTP({ issuer: "Amenallah Edition", label: user.email, algorithm: "SHA1", digits: 6, period: 30, secret })
  const delta = generator.validate({ token: code, window: 1 })
  if (delta === null) return NextResponse.json({ error: "Code invalide" }, { status: 400 })
  const recoveryCodes = generateRecoveryCodes()
  await prisma.mfaCredential.update({
    where: { id: credential.id },
    data: {
      enabledAt: new Date(),
      lastUsedCounter: BigInt(generator.counter() + delta),
      recoveryCodesEncrypted: encryptSecret(JSON.stringify(recoveryCodes)),
    },
  })
  await prisma.auditEvent.create({ data: { userId: user.id, action: "MFA_ENABLED", targetType: "User", targetId: user.id } })
  return NextResponse.json({ enabled: true, recoveryCodes }, { headers: { "Cache-Control": "private, no-store" } })
}
