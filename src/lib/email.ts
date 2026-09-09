import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { encryptSecret } from "@/lib/security-crypto"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Amenallah Edition"
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
const SMTP_SECURE = process.env.SMTP_SECURE !== "false"
const FROM = process.env.SMTP_FROM || `Amenallah Edition <${SMTP_USER || "support@amanallahedition.com"}>`
const REPLY_TO = process.env.SMTP_REPLY_TO || "support@amanallahedition.com"

const transport = SMTP_HOST && SMTP_USER && SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  : null

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] || char)
}

function idempotencyKey(type: string, to: string, unique: string) {
  return `${type}:${to.trim().toLowerCase()}:${unique}`.slice(0, 190)
}

type MailInput = {
  type: string
  to: string
  subject: string
  html: string
  text: string
  userId?: string
  unique: string
  expiresAt?: Date
}

/** Every delivery is recorded so it can be retried/audited without logging secrets. */
async function sendTransactionalMail(input: MailInput) {
  const key = idempotencyKey(input.type, input.to, input.unique)
  const existing = await prisma.emailOutbox.findUnique({ where: { idempotencyKey: key } }).catch(() => null)
  if (existing?.status === "SENT") return

  const outbox = existing || await prisma.emailOutbox.create({
    data: {
      userId: input.userId,
      type: input.type,
      recipient: input.to,
      idempotencyKey: key,
      expiresAt: input.expiresAt,
      payloadEncrypted: (() => {
        try { return encryptSecret(JSON.stringify({ subject: input.subject, html: input.html, text: input.text })) } catch { return null }
      })(),
    },
  })

  if (!transport || process.env.EMAIL_WORKER_ENABLED === "false") {
    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: { lastError: "SMTP_NOT_CONFIGURED", nextAttemptAt: new Date(Date.now() + 15 * 60_000) },
    }).catch(() => undefined)
    return
  }

  try {
    const result = await transport.sendMail({
      from: FROM,
      to: input.to,
      replyTo: REPLY_TO,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: "SENT",
        attempts: { increment: 1 },
        providerMessageId: result.messageId,
        sentAt: new Date(),
        lastError: null,
        payloadEncrypted: null,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : "SMTP_SEND_FAILED"
    await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: "PENDING",
        attempts: { increment: 1 },
        lastError: message,
        nextAttemptAt: new Date(Date.now() + 15 * 60_000),
      },
    }).catch(() => undefined)
    console.error("Transactional email delivery failed", { type: input.type, to: input.to, message })
  }
}

export async function sendVerificationEmail(to: string, name: string, token: string, userId?: string) {
  const safeName = escapeHtml(name)
  const url = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`
  await sendTransactionalMail({
    type: "EMAIL_VERIFY", to, userId, unique: token, expiresAt: new Date(Date.now() + 30 * 60_000),
    subject: `Confirmez votre adresse — ${APP_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="color:#2040e0">${escapeHtml(APP_NAME)}</h1><p>Bonjour ${safeName},</p><p>Confirmez votre adresse email pour activer votre compte.</p><p><a href="${url}" style="background:#2040e0;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Confirmer mon email</a></p><p>Ce lien expire dans 30 minutes.</p><p dir="rtl">مرحباً ${safeName}، أكد بريدك الإلكتروني لتفعيل حسابك. الرابط صالح لمدة 30 دقيقة.</p></div>`,
    text: `Bonjour ${name},\n\nConfirmez votre adresse: ${url}\nCe lien expire dans 30 minutes.`,
  })
}

export async function sendWelcomeEmail(to: string, name: string, userId?: string) {
  const safeName = escapeHtml(name)
  await sendTransactionalMail({
    type: "WELCOME", to, userId, unique: "welcome",
    subject: `Bienvenue sur ${APP_NAME} / مرحباً بك في ${APP_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="color:#2040e0">${escapeHtml(APP_NAME)}</h1><p>Bonjour ${safeName},</p><p>Votre adresse a été confirmée et votre compte est maintenant actif.</p><p><a href="${APP_URL}/login">Se connecter</a></p><p dir="rtl">مرحباً ${safeName}، تم تأكيد بريدك وأصبح حسابك نشطاً.</p></div>`,
    text: `Bonjour ${name},\n\nVotre adresse a été confirmée. Connectez-vous: ${APP_URL}/login`,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string, userId?: string) {
  const safeName = escapeHtml(name)
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`
  await sendTransactionalMail({
    type: "PASSWORD_RESET", to, userId, unique: token, expiresAt: new Date(Date.now() + 20 * 60_000),
    subject: `Réinitialisation du mot de passe — ${APP_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="color:#2040e0">${escapeHtml(APP_NAME)}</h1><p>Bonjour ${safeName},</p><p>Ce lien de réinitialisation est valable 20 minutes.</p><p><a href="${resetUrl}" style="background:#2040e0;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Réinitialiser le mot de passe</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p></div>`,
    text: `Bonjour ${name},\n\nRéinitialisez votre mot de passe dans les 20 minutes: ${resetUrl}`,
  })
}

export async function sendSubscriptionConfirmation(to: string, name: string, plan: string, endDate: Date, userId?: string) {
  const safeName = escapeHtml(name)
  const planLabel = escapeHtml(plan.replace(/_/g, " ").toLowerCase())
  await sendTransactionalMail({
    type: "SUBSCRIPTION_ACTIVATED", to, userId, unique: `${plan}:${endDate.toISOString()}`,
    subject: `Abonnement activé — ${APP_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="color:#2040e0">${escapeHtml(APP_NAME)}</h1><p>Bonjour ${safeName},</p><p>Votre abonnement <strong>${planLabel}</strong> est actif jusqu'au ${endDate.toLocaleDateString("fr-TN")}.</p><p><a href="${APP_URL}/login">Accéder à mon espace</a></p></div>`,
    text: `Bonjour ${name},\n\nVotre abonnement ${planLabel} est actif jusqu'au ${endDate.toLocaleDateString("fr-TN")}.`,
  })
}
