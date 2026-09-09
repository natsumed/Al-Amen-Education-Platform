import crypto from "node:crypto"
import nodemailer from "nodemailer"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function decryptSecret(value) {
  const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY || "", "base64")
  const [version, iv, tag, payload] = value.split(".")
  if (version !== "v1" || key.length !== 32) throw new Error("EMAIL_PAYLOAD_KEY_INVALID")
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"))
  decipher.setAuthTag(Buffer.from(tag, "base64url"))
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload, "base64url")), decipher.final()]).toString("utf8"))
}

const transport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null

async function main() {
  if (!transport || process.env.EMAIL_WORKER_ENABLED === "false") {
    await sleep(30000)
    return
  }
  const row = await prisma.emailOutbox.findFirst({ where: { status: "PENDING", nextAttemptAt: { lte: new Date() }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { createdAt: "asc" } })
  if (!row) { await sleep(3000); return }
  const claimed = await prisma.emailOutbox.updateMany({ where: { id: row.id, status: "PENDING" }, data: { status: "SENDING", attempts: { increment: 1 } } })
  if (!claimed.count) return
  try {
    const payload = row.payloadEncrypted ? decryptSecret(row.payloadEncrypted) : null
    if (!payload) throw new Error("EMAIL_PAYLOAD_MISSING")
    const result = await transport.sendMail({ from: process.env.SMTP_FROM || `Amenallah Edition <${process.env.SMTP_USER}>`, replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER, to: row.recipient, ...payload })
    await prisma.emailOutbox.update({ where: { id: row.id }, data: { status: "SENT", providerMessageId: result.messageId, sentAt: new Date(), payloadEncrypted: null, lastError: null } })
  } catch (error) {
    await prisma.emailOutbox.update({ where: { id: row.id }, data: { status: "PENDING", nextAttemptAt: new Date(Date.now() + 15 * 60 * 1000), lastError: error instanceof Error ? error.message.slice(0, 240) : "EMAIL_SEND_FAILED" } })
  }
}

try { while (true) await main() } finally { await prisma.$disconnect() }
