import { Resend } from "resend"

const RESEND_KEY = process.env.RESEND_API_KEY
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@edutunisia.tn"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Amenallah Edition"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function sendWelcomeEmail(to: string, name: string) {
  if (!resend) return
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Bienvenue sur ${APP_NAME} / مرحباً بك في ${APP_NAME}`,
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2040e0;">${APP_NAME}</h1>
          <p>Bonjour ${name},</p>
          <p>Bienvenue sur ${APP_NAME}! Votre compte a été créé avec succès.</p>
          <p>Commencez à explorer nos cours et ressources pédagogiques.</p>
          <a href="${APP_URL}/login" style="background:#2040e0;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
            Se connecter
          </a>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p dir="rtl" style="font-family: Arial, sans-serif;">
            مرحباً ${name}،<br>
            مرحباً بك في ${APP_NAME}! تم إنشاء حسابك بنجاح.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send welcome email:", error)
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
) {
  if (!resend) return
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Réinitialisation du mot de passe — ${APP_NAME}`,
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2040e0;">${APP_NAME}</h1>
          <p>Bonjour ${name},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 1 heure):</p>
          <a href="${resetUrl}" style="background:#2040e0;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
            Réinitialiser le mot de passe
          </a>
          <p style="margin-top: 16px; color: #64748b; font-size: 14px;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
          </p>
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p dir="rtl">
            لإعادة تعيين كلمة المرور، انقر على الرابط أعلاه (صالح لمدة ساعة واحدة).
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send password reset email:", error)
  }
}

export async function sendSubscriptionConfirmation(
  to: string,
  name: string,
  plan: string,
  endDate: Date
) {
  if (!resend) return
  const planLabel = plan.replace(/_/g, " ").toLowerCase()
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Abonnement activé — ${APP_NAME}`,
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2040e0;">${APP_NAME}</h1>
          <p>Bonjour ${name},</p>
          <p>Votre abonnement <strong>${planLabel}</strong> a été activé avec succès.</p>
          <p>Date d'expiration: <strong>${endDate.toLocaleDateString("fr-TN")}</strong></p>
          <a href="${APP_URL}/dashboard" style="background:#2040e0;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
            Accéder à mon espace
          </a>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send subscription confirmation email:", error)
  }
}
