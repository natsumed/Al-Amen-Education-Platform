import React, { useEffect, useState } from "react"
import { Text } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "../../components/Screen"
import { PrimaryButton } from "../../components/PrimaryButton"
import { ErrorBanner } from "../../components/EmptyState"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import type { RootStackParamList } from "../../navigation/types"
import { colors, typography } from "../../theme"

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmail">
export function VerifyEmailScreen({ route, navigation }: Props) {
  const { language } = useAuth()
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  useEffect(() => { void api.verifyEmail(route.params.token).then(() => setDone(true)).catch((e) => setError(e instanceof Error ? e.message : "Error")) }, [route.params.token])
  return <Screen><Text style={{ ...typography.h1, color: colors.text, marginBottom: 16 }}>{done ? (language === "ar" ? "تم تأكيد البريد" : "Email confirmé") : (language === "ar" ? "تأكيد البريد" : "Confirmation de l’email")}</Text>{error ? <ErrorBanner message={error} /> : null}<Text style={{ ...typography.body, color: colors.muted }}>{done ? (language === "ar" ? "يمكنك الآن تسجيل الدخول." : "Vous pouvez maintenant vous connecter.") : error ? "Lien invalide ou expiré." : "…"}</Text>{done || error ? <PrimaryButton label={language === "ar" ? "تسجيل الدخول" : "Se connecter"} onPress={() => navigation.replace("Login")} /> : null}</Screen>
}
