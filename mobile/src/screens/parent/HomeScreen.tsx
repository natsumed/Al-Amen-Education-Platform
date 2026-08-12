import React, { useCallback, useState } from "react"
import { View, Text, StyleSheet, Linking, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { api, getApiBaseUrl } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import type { ParentTabParamList } from "../../navigation/types"

export function ParentHomeScreen() {
  const { user, token, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<BottomTabNavigationProp<ParentTabParamList>>()
  const [childCount, setChildCount] = useState<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      void api
        .parentChildren(token)
        .then((data) => setChildCount((data.links || []).length))
        .catch(() => setChildCount(null))
    }, [token])
  )

  const openPay = () => {
    try {
      void Linking.openURL(`${getApiBaseUrl()}/parent/pay`)
    } catch {
      /* ignore */
    }
  }

  return (
    <Screen scroll>
      <AppHeader
        title={t("brand", language)}
        subtitle={user?.fullName}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />

      <View style={[styles.banner, shadow.card]}>
        <View style={styles.bannerIcon}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        </View>
        <Text style={styles.bannerTitle}>{t("parentWelcome", language)}</Text>
        <Text style={styles.bannerSub}>{t("parentNoCourses", language)}</Text>
      </View>

      <Pressable style={[styles.card, shadow.card]} onPress={() => navigation.navigate("ChildrenTab")}>
        <View style={styles.cardIcon}>
          <Ionicons name="people" size={22} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{t("children", language)}</Text>
          {childCount !== null ? (
            <Text style={styles.cardSub}>
              {childCount} {t("children", language)}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Pressable style={[styles.card, shadow.card]} onPress={openPay}>
        <View style={styles.cardIcon}>
          <Ionicons name="card" size={22} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{t("payOnWeb", language)}</Text>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.muted} />
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  bannerTitle: { ...typography.h2, color: colors.text },
  bannerSub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  card: {
    marginTop: spacing.md,
    minHeight: 64,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.bodyBold, color: colors.text },
  cardSub: { ...typography.caption, color: colors.muted, marginTop: 2 },
})
