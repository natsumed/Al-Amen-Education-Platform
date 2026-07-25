import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { PrimaryButton } from "../../components/PrimaryButton"
import { colors, radius, spacing, typography } from "../../theme"
import type { LearnerTabParamList } from "../../navigation/types"

export function StudentHomeScreen() {
  const { user, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<BottomTabNavigationProp<LearnerTabParamList>>()

  return (
    <Screen scroll>
      <AppHeader
        title={t("brand", language)}
        subtitle={`${user?.fullName || ""} · ${t("continueLearning", language)}`}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {language === "ar" ? "مرحباً" : "Bonjour"}, {user?.fullName?.split(" ")[0]}
        </Text>
        <Text style={styles.heroSub}>{t("continueLearning", language)}</Text>
        <PrimaryButton
          label={t("browse", language)}
          onPress={() => navigation.navigate("CatalogueTab")}
          style={{ marginTop: spacing.lg }}
        />
      </View>
      {user?.publicId ? (
        <View style={styles.idBox}>
          <Text style={styles.idLabel}>{t("accountNumber", language)}</Text>
          <Text style={styles.idValue}>{user.publicId}</Text>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "#d4dbf7",
  },
  heroTitle: { ...typography.h1, color: colors.text },
  heroSub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  idBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idLabel: { ...typography.caption, color: colors.muted },
  idValue: {
    ...typography.h2,
    color: colors.primary,
    marginTop: 4,
    letterSpacing: 2,
  },
})
