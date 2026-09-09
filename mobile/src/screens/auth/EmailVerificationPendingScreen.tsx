import React, { useEffect, useState } from "react"
import { Linking, Text } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "../../components/Screen"
import { PrimaryButton } from "../../components/PrimaryButton"
import { ErrorBanner } from "../../components/EmptyState"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { RootStackParamList } from "../../navigation/types"
import { colors, spacing, typography } from "../../theme"

type Props = NativeStackScreenProps<RootStackParamList, "EmailVerificationPending">
const COOLDOWN = 60

function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}@${domain}`
}

export function EmailVerificationPendingScreen({ route, navigation }: Props) {
  const { language } = useAuth()
  const isAr = language === "ar"
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => {
    if (!cooldown) return
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const resend = async () => {
    setBusy(true); setError(""); setMessage("")
    try {
      await api.resendVerification(route.params.email)
      setCooldown(COOLDOWN)
      setMessage(isAr ? "إذا كان الحساب يحتاج التأكيد، أرسلنا رابطاً جديداً." : "Si le compte nécessite une confirmation, un nouveau lien a été envoyé.")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error") } finally { setBusy(false) }
  }

  return <Screen scroll style={{ paddingHorizontal: spacing.lg }}>
    <Text style={{ ...typography.h1, color: colors.text, marginTop: spacing.xl }}>{isAr ? "أكد بريدك الإلكتروني" : "Confirmez votre email"}</Text>
    <Text style={{ ...typography.body, color: colors.muted, marginTop: spacing.md }}>{isAr ? "تم إنشاء حسابك. افتح رسالة التأكيد لتفعيل الحساب." : "Votre compte a été créé. Ouvrez le message de confirmation pour l'activer."}</Text>
    <Text style={{ ...typography.body, color: colors.text, marginTop: spacing.sm }}>{maskEmail(route.params.email)}</Text>
    {route.params.linkPending ? <Text style={{ ...typography.caption, color: colors.muted, marginTop: spacing.md }}>{isAr ? "طلب ربط التلميذ في انتظار القبول." : "La demande de liaison avec l'élève est en attente."}</Text> : null}
    {error ? <ErrorBanner message={error} /> : null}
    {message ? <Text style={{ ...typography.caption, color: colors.success, marginTop: spacing.md }}>{message}</Text> : null}
    <PrimaryButton label={isAr ? "فتح تطبيق البريد" : "Ouvrir l'application email"} onPress={() => { void Linking.openURL("mailto:") }} style={{ marginTop: spacing.xl }} />
    <PrimaryButton label={cooldown ? `${isAr ? "إعادة الإرسال بعد" : "Renvoyer dans"} ${cooldown}s` : (isAr ? "إعادة إرسال البريد" : "Renvoyer l'email")} variant="outline" loading={busy} disabled={cooldown > 0} onPress={() => { void resend() }} style={{ marginTop: spacing.md }} />
    <PrimaryButton label={isAr ? "العودة إلى تسجيل الدخول" : "Retour à la connexion"} variant="ghost" onPress={() => navigation.replace("Login")} style={{ marginTop: spacing.md }} />
  </Screen>
}
