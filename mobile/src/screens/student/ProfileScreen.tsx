import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { colors, radius, spacing, typography } from "../../theme"

export function ProfileScreen() {
  const { user, language, setLanguage, logout } = useAuth()

  return (
    <Screen scroll>
      <AppHeader
        title={t("profile", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />
      <View style={styles.card}>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
        {user?.publicId ? (
          <>
            <Text style={styles.idLabel}>{t("accountNumber", language)}</Text>
            <Text style={styles.idValue}>{user.publicId}</Text>
          </>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { ...typography.h1, color: colors.text },
  email: { ...typography.body, color: colors.muted, marginTop: spacing.xs },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleText: { ...typography.caption, color: colors.primary, fontWeight: "700" },
  idLabel: { ...typography.caption, color: colors.muted, marginTop: spacing.xl },
  idValue: { ...typography.h2, color: colors.primary, letterSpacing: 2, marginTop: 4 },
})
