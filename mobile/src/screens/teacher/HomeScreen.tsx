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

export function TeacherHomeScreen() {
  const { user, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<BottomTabNavigationProp<LearnerTabParamList>>()

  return (
    <Screen scroll>
      <AppHeader
        title={t("brand", language)}
        subtitle={user?.fullName}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />
      <View style={styles.hero}>
        <Text style={styles.title}>
          {language === "ar" ? "مرحباً" : "Bienvenue"}, {user?.fullName?.split(" ")[0]}
        </Text>
        <Text style={styles.sub}>{t("teacherWelcome", language)}</Text>
        <PrimaryButton
          label={t("browse", language)}
          onPress={() => navigation.navigate("CatalogueTab")}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  title: { ...typography.h1, color: colors.text },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
})
