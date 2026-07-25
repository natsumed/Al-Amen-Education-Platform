import React from "react"
import { Text, StyleSheet } from "react-native"
import { useAuth } from "../lib/auth-context"
import { t } from "../lib/i18n"
import { Screen } from "../components/Screen"
import { AppHeader } from "../components/AppHeader"
import { PrimaryButton } from "../components/PrimaryButton"
import { colors, typography, spacing } from "../theme"

export function AdminBlockedScreen() {
  const { language, setLanguage, logout } = useAuth()

  return (
    <Screen scroll>
      <AppHeader
        title={t("brand", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
      />
      <Text style={styles.text}>{t("adminBlocked", language)}</Text>
      <PrimaryButton label={t("logout", language)} onPress={logout} style={{ marginTop: spacing.xl }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  text: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
})
