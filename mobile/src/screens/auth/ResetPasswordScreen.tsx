import React, { useState } from "react"
import { Text } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "../../components/Screen"
import { PrimaryButton } from "../../components/PrimaryButton"
import { ErrorBanner } from "../../components/EmptyState"
import { TextField } from "../../components/TextField"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { RootStackParamList } from "../../navigation/types"
import { colors, spacing, typography } from "../../theme"

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">
export function ResetPasswordScreen({ route, navigation }: Props) {
  const { language } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async () => { setBusy(true); setError(""); try { await api.resetPassword(route.params.token, password, confirm); setDone(true) } catch (e) { setError(e instanceof Error ? e.message : "Error") } finally { setBusy(false) } }
  return <Screen scroll><Text style={{ ...typography.h1, color: colors.text, marginVertical: spacing.xl }}>{language === "ar" ? "إعادة تعيين كلمة المرور" : "Réinitialiser le mot de passe"}</Text>{error ? <ErrorBanner message={error} /> : null}{done ? <Text style={{ color: colors.success }}>{language === "ar" ? "تم التحديث." : "Mot de passe mis à jour."}</Text> : <><TextField label={language === "ar" ? "كلمة المرور" : "Mot de passe"} secureTextEntry value={password} onChangeText={setPassword} /><TextField label={language === "ar" ? "تأكيد" : "Confirmation"} secureTextEntry value={confirm} onChangeText={setConfirm} /><PrimaryButton label={language === "ar" ? "حفظ" : "Enregistrer"} onPress={() => { void submit() }} loading={busy} /></>}{done ? <PrimaryButton label={language === "ar" ? "تسجيل الدخول" : "Se connecter"} onPress={() => navigation.replace("Login")} /> : null}</Screen>
}
