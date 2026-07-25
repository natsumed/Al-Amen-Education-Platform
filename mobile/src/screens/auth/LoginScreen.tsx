import React, { useState } from "react"
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native"
import { useAuth } from "../../lib/auth-context"
import { getApiBaseUrl } from "../../lib/api"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { PrimaryButton } from "../../components/PrimaryButton"
import { ErrorBanner } from "../../components/EmptyState"
import { colors, radius, spacing, typography } from "../../theme"

export function LoginScreen() {
  const { login, language, setLanguage } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const onSubmit = async () => {
    setError("")
    setBusy(true)
    try {
      await login(email.trim(), password)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("loginFailed", language)
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>A</Text>
          </View>
          <Text style={styles.brand}>{t("brand", language)}</Text>
          <Text style={styles.sub}>{t("brandSub", language)}</Text>
        </View>

        <View style={styles.card}>
          <PrimaryButton
            label={language === "ar" ? "FR" : "عربي"}
            variant="ghost"
            onPress={() => setLanguage(language === "ar" ? "fr" : "ar")}
            style={styles.lang}
          />

          {error ? <ErrorBanner message={error} /> : null}

          <TextField
            label={t("email", language)}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="student@edutunisia.tn"
          />
          <TextField
            label={t("password", language)}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
          />

          <PrimaryButton
            label={t("login", language)}
            onPress={onSubmit}
            loading={busy}
          />

          <Text style={styles.hint}>{t("installExpoFirst", language)}</Text>
          {__DEV__ ? (
            <Text style={styles.debug}>API: {getApiBaseUrl()}</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "center", paddingVertical: spacing.xl },
  hero: { alignItems: "center", marginBottom: spacing.xl },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoLetter: { color: "#fff", fontSize: 28, fontWeight: "800" },
  brand: { ...typography.brand, color: colors.primary },
  sub: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lang: { alignSelf: "flex-end", minHeight: 40, marginBottom: spacing.sm },
  hint: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  debug: {
    ...typography.tiny,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
})
