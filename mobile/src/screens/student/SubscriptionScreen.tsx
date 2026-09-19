import React, { useCallback, useState } from "react"
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { api, getApiBaseUrl, type PaymentMethod, type PaymentProvider, type Subscription } from "../../lib/api"
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
  const { user, token, language } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [provider, setProvider] = useState<PaymentProvider>("MANUAL_CASH")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [paymentMessage, setPaymentMessage] = useState("")

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      void Promise.all([
        api.getSubscription(token),
        api.paymentMethods(),
        pendingPaymentId ? api.getPayment(token, pendingPaymentId) : Promise.resolve(null),
      ])
        .then(([data, available, payment]) => {
          setSubscription(data.subscription)
          setMethods(available.methods.filter((method) => method.available))
          if (!available.methods.some((method) => method.provider === provider && method.available)) {
            setProvider("MANUAL_CASH")
          }
          if (payment?.status === "SUCCEEDED") {
            setPendingPaymentId(null)
            setPaymentMessage(language === "ar" ? "تم تفعيل اشتراكك." : "Votre abonnement est activé.")
          } else if (payment && ["DECLINED", "CANCELLED", "EXPIRED", "INITIATION_FAILED"].includes(payment.status)) {
            setPendingPaymentId(null)
            setPaymentMessage(language === "ar" ? "لم تكتمل عملية الدفع." : "Le paiement n’a pas abouti.")
          }
          if (data.subscription) void scheduleSubscriptionReminder(data.subscription.endDate, language)
        })
        .catch(() => {})
    }, [token, language, pendingPaymentId, provider])
  )

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0

  const openPricing = () => Linking.openURL(`${getApiBaseUrl()}/pricing`)
  const relevantPlans = PLANS.filter((plan) => (user?.role === "TEACHER" ? plan.role === "TEACHER" : plan.role === "STUDENT"))

  const pay = async (plan: Plan) => {
    if (!token || !termsAccepted) {
      Alert.alert(
        language === "ar" ? "الموافقة مطلوبة" : "Acceptation requise",
        language === "ar" ? "وافق على الشروط وسياسة الاسترجاع أولاً." : "Acceptez d’abord les conditions et la politique de remboursement."
      )
      return
    }
    setLoadingPlan(plan.id)
    setPaymentMessage("")
    try {
      const result = await api.createPayment(token, {
        productKind: "SUBSCRIPTION",
        productId: plan.id,
        provider,
      }, `mobile-sub-${plan.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      setPendingPaymentId(result.paymentId)
      if (result.redirectUrl) {
        await Linking.openURL(result.redirectUrl)
      } else {
        setPaymentMessage(language === "ar"
          ? `تم تسجيل طلب الدفع نقداً. المرجع: ${result.merchantOrderRef}`
          : `Demande de paiement en espèces enregistrée. Référence : ${result.merchantOrderRef}`)
      }
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "Payment error")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <Screen scroll>
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
      <View style={styles.methods}>
        {methods.map((method) => (
          <Pressable
            key={method.provider}
            onPress={() => setProvider(method.provider)}
            style={[styles.method, provider === method.provider && styles.methodActive]}
          >
            <Text style={[styles.methodText, provider === method.provider && styles.methodTextActive]}>
              {method.provider === "MANUAL_CASH"
                ? (language === "ar" ? "نقداً" : "Espèces")
                : "ClicToPay"}
            </Text>
          </Pressable>
        ))}
      </View>
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
          <PrimaryButton
            label={language === "ar" ? "اختيار" : "Choisir"}
            onPress={() => void pay(plan)}
            loading={loadingPlan === plan.id}
            disabled={!termsAccepted}
            style={styles.choose}
          />
        </View>
      ))}

      <Pressable style={styles.terms} onPress={() => setTermsAccepted((value) => !value)}>
        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
          {termsAccepted ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
        </View>
        <Text style={styles.termsText}>
          {language === "ar"
            ? "أوافق على الشروط وسياسة الخصوصية والاسترجاع."
            : "J’accepte les conditions, la confidentialité et la politique de remboursement."}
        </Text>
      </Pressable>
      {paymentMessage ? <Text style={styles.message}>{paymentMessage}</Text> : null}
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
    flexWrap: "wrap",
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
  choose: { width: "100%", marginTop: spacing.md },
  methods: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  method: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  methodText: { ...typography.caption, color: colors.textSecondary },
  methodTextActive: { color: colors.primary },
  terms: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.sm },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  message: { ...typography.caption, color: colors.primary, marginTop: spacing.md },
  manage: { marginTop: spacing.md },
})
