import React, { useState } from "react"
import { StyleSheet, Text } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { ErrorBanner } from "../../components/EmptyState"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import type { RootStackParamList } from "../../navigation/types"
import { colors, spacing, typography } from "../../theme"

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">

export function ForgotPasswordScreen({ navigation }: Props) {
  const { language } = useAuth()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const submit = async () => {
    setBusy(true)
    setError("")
    try {
      const result = await api.forgotPassword(email.trim())
      setMessage(result.message || t("resetSent", language))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>{t("forgotPassword", language)}</Text>
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <TextField
        label={t("email", language)}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <PrimaryButton label={t("sendResetLink", language)} onPress={submit} loading={busy} />
      <PrimaryButton
        label={t("backToLogin", language)}
        variant="ghost"
        onPress={() => navigation.replace("Login")}
        style={styles.back}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.text, marginVertical: spacing.xl },
  success: { ...typography.body, color: colors.success, marginBottom: spacing.lg },
  back: { marginTop: spacing.md },
})
