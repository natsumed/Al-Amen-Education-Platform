import React, { useEffect, useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { ErrorBanner } from "../../components/EmptyState"
import { GradeChip } from "../../components/GradeChip"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { colors, spacing, typography } from "../../theme"

type Role = "STUDENT" | "PARENT" | "TEACHER"

export function SocialOnboardingScreen() {
  const { token, language, updateUser, logout } = useAuth()
  const isAr = language === "ar"
  const [role, setRole] = useState<Role>("STUDENT")
  const [phone, setPhone] = useState("")
  const [studentPublicId, setStudentPublicId] = useState("")
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    void api.onboarding(token).then((data) => { setPhone(data.user.phone || ""); setMfaEnabled(data.mfaEnabled) }).catch((cause) => setError(cause instanceof Error ? cause.message : "Error"))
  }, [token])

  const beginMfa = async () => {
    if (!token) return
    setBusy(true); setError("")
    try { const data = await api.startMfa(token); setMfaSecret(data.secret) } catch (cause) { setError(cause instanceof Error ? cause.message : "MFA unavailable") } finally { setBusy(false) }
  }
  const confirmMfa = async () => {
    if (!token) return
    setBusy(true); setError("")
    try { await api.confirmMfa(token, mfaCode); setMfaEnabled(true); setMfaSecret("") } catch (cause) { setError(cause instanceof Error ? cause.message : "Code invalide") } finally { setBusy(false) }
  }
  const submit = async () => {
    if (!token) return
    if (role === "TEACHER" && !mfaEnabled) { setError(isAr ? "فعّل المصادقة الثنائية أولاً." : "Activez d'abord la double authentification."); return }
    setBusy(true); setError("")
    try {
      const result = await api.completeOnboarding(token, { role, preferredLanguage: language, phone: phone || undefined, studentPublicId: role === "PARENT" && studentPublicId ? studentPublicId : undefined })
      updateUser(result.user)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de terminer l'inscription") } finally { setBusy(false) }
  }

  return <Screen style={styles.screen}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>{isAr ? "أكمل حسابك" : "Complétez votre compte"}</Text>
    <Text style={styles.subtitle}>{isAr ? "اختر نوع الحساب لتفعيل المساحة المناسبة." : "Choisissez votre profil pour activer votre espace."}</Text>
    {error ? <ErrorBanner message={error} /> : null}
    <View style={styles.roles}>{(["STUDENT", "PARENT", "TEACHER"] as Role[]).map((value) => <GradeChip key={value} label={value === "STUDENT" ? (isAr ? "تلميذ" : "Élève") : value === "PARENT" ? (isAr ? "ولي" : "Parent") : (isAr ? "معلّم" : "Enseignant")} active={role === value} onPress={() => setRole(value)} />)}</View>
    <TextField label={isAr ? "الهاتف (اختياري)" : "Téléphone (facultatif)"} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    {role === "PARENT" ? <TextField label={isAr ? "رقم حساب التلميذ (اختياري)" : "N° compte élève (facultatif)"} value={studentPublicId} onChangeText={(value) => setStudentPublicId(value.replace(/\D/g, "").slice(0, 8))} keyboardType="number-pad" maxLength={8} /> : null}
    {role === "TEACHER" ? <View style={styles.mfa}><Text style={styles.mfaTitle}>{isAr ? "المصادقة الثنائية مطلوبة" : "Double authentification requise"}</Text>{!mfaEnabled && !mfaSecret ? <PrimaryButton label={isAr ? "إعداد تطبيق المصادقة" : "Configurer l'application"} variant="outline" onPress={() => { void beginMfa() }} loading={busy} /> : null}{mfaSecret ? <><Text style={styles.secretHint}>{isAr ? "أضف المفتاح يدوياً في تطبيق المصادقة ثم أدخل الرمز:" : "Ajoutez cette clé dans votre application d'authentification, puis entrez le code :"}</Text><Text selectable style={styles.secret}>{mfaSecret}</Text><TextField label={isAr ? "رمز المصادقة" : "Code d'authentification"} value={mfaCode} onChangeText={setMfaCode} keyboardType="number-pad" maxLength={12} /><PrimaryButton label={isAr ? "تأكيد الرمز" : "Confirmer le code"} variant="outline" onPress={() => { void confirmMfa() }} loading={busy} /></> : null}{mfaEnabled ? <Text style={styles.enabled}>{isAr ? "تم تفعيل المصادقة الثنائية." : "Double authentification activée."}</Text> : null}</View> : null}
    <PrimaryButton label={isAr ? "تفعيل الحساب" : "Activer mon compte"} onPress={() => { void submit() }} loading={busy} style={{ marginTop: spacing.lg }} />
    <PrimaryButton label={isAr ? "تسجيل الخروج" : "Se déconnecter"} variant="ghost" onPress={() => { void logout() }} style={{ marginTop: spacing.md }} />
  </ScrollView></Screen>
}

const styles = StyleSheet.create({ screen: { paddingHorizontal: 0 }, content: { padding: spacing.lg }, title: { ...typography.h1, color: colors.text }, subtitle: { ...typography.body, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.lg }, roles: { flexDirection: "row", marginBottom: spacing.lg }, mfa: { borderWidth: 1, borderColor: colors.border, padding: spacing.md, borderRadius: 12, marginTop: spacing.md }, mfaTitle: { ...typography.body, color: colors.text, marginBottom: spacing.sm }, secretHint: { ...typography.caption, color: colors.muted, marginTop: spacing.sm }, secret: { ...typography.caption, color: colors.text, marginVertical: spacing.sm }, enabled: { ...typography.caption, color: colors.success } })
