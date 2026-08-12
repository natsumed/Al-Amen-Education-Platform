import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { useAuth } from "../../lib/auth-context"
import { greeting, t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import type { LearnerTabParamList } from "../../navigation/types"

export function TeacherHomeScreen() {
  const { user, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<BottomTabNavigationProp<LearnerTabParamList>>()

  const openSubscription = () => navigation.navigate("ProfileTab", { screen: "Subscription" })

  return (
    <Screen scroll>
      <AppHeader
        title={t("brand", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />
      <View style={[styles.hero, shadow.card]}>
        <View style={styles.rolePill}>
          <Ionicons name="briefcase" size={12} color={colors.primary} />
          <Text style={styles.roleText}>{t("teacher", language)}</Text>
        </View>
        <Text style={styles.title}>
          {greeting(language)}, {user?.fullName?.split(" ")[0]}
        </Text>
        <Text style={styles.sub}>{t("teacherWelcome", language)}</Text>
      </View>

      <HubCard
        icon="compass"
        title={t("teacherHubBrowse", language)}
        onPress={() => navigation.navigate("CatalogueTab")}
      />
      <HubCard
        icon="library"
        title={t("teacherHubLibrary", language)}
        onPress={() => navigation.navigate("MyCoursesTab")}
      />
      <HubCard icon="card" title={t("teacherHubSub", language)} onPress={openSubscription} />
    </Screen>
  )
}

function HubCard({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.card, shadow.card]} onPress={onPress}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon as never} size={22} color={colors.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  roleText: { ...typography.tiny, color: colors.primary },
  title: { ...typography.h1, color: colors.text },
  sub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  card: {
    marginTop: spacing.md,
    minHeight: 64,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
})
