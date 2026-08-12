import React, { useCallback, useState } from "react"
import { Linking, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { AppHeader } from "../../components/AppHeader"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { api, getApiBaseUrl, type Subscription } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import { scheduleSubscriptionReminder } from "../../lib/notifications"

type Plan = {
  id: string
  labelKey: "planStudentMonthly" | "planStudentYearly" | "planTeacherMonthly" | "planTeacherYearly"
  price: number
  period: "perMonth" | "perYear"
  role: "STUDENT" | "TEACHER"
  popular?: boolean
}

const PLANS: Plan[] = [
  { id: "STUDENT_MONTHLY", labelKey: "planStudentMonthly", price: 15, period: "perMonth", role: "STUDENT" },
  { id: "STUDENT_YEARLY", labelKey: "planStudentYearly", price: 120, period: "perYear", role: "STUDENT", popular: true },
  { id: "TEACHER_MONTHLY", labelKey: "planTeacherMonthly", price: 25, period: "perMonth", role: "TEACHER" },
  { id: "TEACHER_YEARLY", labelKey: "planTeacherYearly", price: 200, period: "perYear", role: "TEACHER", popular: true },
]

export function SubscriptionScreen() {
  const { user, token, language, setLanguage, logout } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      void api
        .getSubscription(token)
        .then((data) => {
          setSubscription(data.subscription)
          if (data.subscription) void scheduleSubscriptionReminder(data.subscription.endDate, language)
        })
        .catch(() => {})
    }, [token, language])
  )

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0

  const openPricing = () => Linking.openURL(`${getApiBaseUrl()}/pricing`)
  const relevantPlans = PLANS.filter((plan) => (user?.role === "TEACHER" ? plan.role === "TEACHER" : plan.role === "STUDENT"))

  return (
    <Screen scroll>
      <AppHeader
        title={t("subscription", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />

      <View style={[styles.current, shadow.card, subscription ? styles.active : styles.inactive]}>
        <Ionicons
          name={subscription ? "shield-checkmark" : "lock-closed"}
          size={26}
          color={subscription ? colors.success : colors.warning}
        />
        <Text style={styles.currentTitle}>
          {subscription ? subscription.plan.replaceAll("_", " ") : t("freePlan", language)}
        </Text>
        <Text style={styles.currentStatus}>
          {subscription ? `${daysLeft} ${t("daysRemaining", language)}` : t("locked", language)}
        </Text>
        {subscription ? (
          <Text style={styles.currentDate}>{new Date(subscription.endDate).toLocaleDateString()}</Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>{t("subscription", language)}</Text>
      {relevantPlans.map((plan) => (
        <View key={plan.id} style={[styles.plan, shadow.card, plan.popular && styles.planPopular]}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{t(plan.labelKey, language)}</Text>
            <Text style={styles.planPrice}>
              {plan.price} TND
              <Text style={styles.planPeriod}>{t(plan.period, language)}</Text>
            </Text>
          </View>
          {plan.popular ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>★</Text>
            </View>
          ) : null}
        </View>
      ))}

      <PrimaryButton label={t("subscribe", language)} onPress={openPricing} style={styles.cta} />
      <PrimaryButton label={t("managePlanWeb", language)} variant="outline" onPress={openPricing} style={styles.manage} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  current: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },
  active: { borderColor: colors.success },
  inactive: {},
  currentTitle: { ...typography.h1, color: colors.text, marginTop: spacing.md, textTransform: "capitalize" },
  currentStatus: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  currentDate: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  sectionTitle: { ...typography.h2, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  planPopular: { borderColor: colors.primary },
  planInfo: { flex: 1 },
  planName: { ...typography.bodyBold, color: colors.text },
  planPrice: { ...typography.h2, color: colors.primary, marginTop: spacing.xs },
  planPeriod: { ...typography.caption, color: colors.muted },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.accent, fontSize: 16 },
  cta: { marginTop: spacing.md },
  manage: { marginTop: spacing.md },
})
