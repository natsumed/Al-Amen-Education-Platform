import React, { useCallback, useState } from "react"
import { Alert, View, Text, StyleSheet, ActivityIndicator, Linking } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { api, type PaymentMethod, type PaymentProvider } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { contentTitle, t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { EmptyState } from "../../components/EmptyState"
import { PrimaryButton } from "../../components/PrimaryButton"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import type { ChildrenStackParamList } from "../../navigation/types"

type Props = NativeStackScreenProps<ChildrenStackParamList, "ChildDetail">

type ChildProgress = {
  id: string
  progressPercent: number
  completed: boolean
  content: { titleFr: string; titleAr: string }
}

export function ChildDetailScreen({ route, navigation }: Props) {
  const { linkId } = route.params
  const { token, language } = useAuth()
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<{
    id: string
    fullName: string
    email: string
    publicId?: string
    progress: ChildProgress[]
  } | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [payingPlan, setPayingPlan] = useState<string | null>(null)
  const [paymentMessage, setPaymentMessage] = useState("")

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await api.parentChildren(token)
      const link = (data.links || []).find((item) => item.id === linkId)
      if (link) {
        setChild({
          id: link.student.id,
          fullName: link.student.fullName,
          email: link.student.email,
          publicId: link.student.publicId,
          progress: (link.student.progress || []) as ChildProgress[],
        })
        navigation.setOptions({ title: link.student.fullName })
      }
      void api.paymentMethods().then((result) => setMethods(result.methods.filter((method) => method.available))).catch(() => {})
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [token, linkId, navigation])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </Screen>
    )
  }

  if (!child) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title={t("noChildren", language)} />
      </Screen>
    )
  }

  const createPayment = async (plan: "STUDENT_MONTHLY" | "STUDENT_YEARLY", provider: PaymentProvider) => {
    if (!token) return
    setPayingPlan(plan)
    setPaymentMessage("")
    try {
      const payment = await api.createPayment(token, {
        productKind: "SUBSCRIPTION",
        productId: plan,
        provider,
        beneficiaryId: child.id,
      }, `mobile-parent-${child.id}-${plan}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      if (payment.redirectUrl) await Linking.openURL(payment.redirectUrl)
      setPaymentMessage(payment.redirectUrl
        ? (language === "ar" ? "تحقق من حالة الدفع عند العودة." : "Le paiement sera vérifié à votre retour.")
        : (language === "ar" ? `تم تسجيل الطلب: ${payment.merchantOrderRef}` : `Demande enregistrée : ${payment.merchantOrderRef}`))
    } catch (paymentError) {
      setPaymentMessage(paymentError instanceof Error ? paymentError.message : "Payment error")
    } finally {
      setPayingPlan(null)
    }
  }

  const choosePayment = (plan: "STUDENT_MONTHLY" | "STUDENT_YEARLY") => {
    const buttons: Array<{ text: string; style?: "cancel"; onPress?: () => void }> = [
      { text: language === "ar" ? "نقداً" : "Espèces", onPress: () => void createPayment(plan, "MANUAL_CASH") },
    ]
    if (methods.some((method) => method.provider === "CLICTOPAY")) {
      buttons.push({ text: "ClicToPay", onPress: () => void createPayment(plan, "CLICTOPAY") })
    }
    buttons.push({ text: language === "ar" ? "إلغاء" : "Annuler", style: "cancel" })
    Alert.alert(
      language === "ar" ? "الدفع للطفل" : "Paiement pour l’enfant",
      language === "ar"
        ? "بالمتابعة، توافق على الشروط وسياسة الخصوصية والاسترجاع."
        : "En continuant, vous acceptez les conditions, la confidentialité et la politique de remboursement.",
      buttons
    )
  }

  return (
    <Screen scroll>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.name}>{child.fullName}</Text>
        <Text style={styles.email}>{child.email}</Text>
        {child.publicId ? <Text style={styles.pid}>#{child.publicId}</Text> : null}
      </View>

      <Text style={styles.section}>{language === "ar" ? "اشتراك الطفل" : "Abonnement de l’enfant"}</Text>
      <PrimaryButton
        label={language === "ar" ? "شهري — 15.000 د.ت" : "Mensuel — 15.000 TND"}
        onPress={() => choosePayment("STUDENT_MONTHLY")}
        loading={payingPlan === "STUDENT_MONTHLY"}
        style={styles.pay}
      />
      <PrimaryButton
        label={language === "ar" ? "سنوي — 120.000 د.ت" : "Annuel — 120.000 TND"}
        onPress={() => choosePayment("STUDENT_YEARLY")}
        loading={payingPlan === "STUDENT_YEARLY"}
        variant="outline"
        style={styles.paySecondary}
      />
      {paymentMessage ? <Text style={styles.message}>{paymentMessage}</Text> : null}

      <Text style={styles.section}>{t("childProgress", language)}</Text>
      {child.progress.length === 0 ? (
        <EmptyState icon="stats-chart-outline" title={t("emptyProgressTitle", language)} />
      ) : (
        child.progress.map((row) => (
          <View key={row.id} style={[styles.progressCard, shadow.card]}>
            <View style={styles.progressTop}>
              <Text style={styles.progressTitle} numberOfLines={2}>
                {contentTitle(row.content, language)}
              </Text>
              <Text style={[styles.progressPct, row.completed && styles.done]}>
                {row.completed ? t("completed", language) : `${row.progressPercent}%`}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(3, row.progressPercent)}%` },
                  row.completed && styles.fillDone,
                ]}
              />
            </View>
          </View>
        ))
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  name: { ...typography.h1, color: colors.text },
  email: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  pid: { ...typography.caption, color: colors.primary, marginTop: spacing.sm },
  pay: { marginTop: spacing.lg },
  paySecondary: { marginTop: spacing.sm },
  message: { ...typography.caption, color: colors.primary, marginTop: spacing.md },
  section: { ...typography.h2, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  progressTitle: { ...typography.bodyBold, color: colors.text, flex: 1 },
  progressPct: { ...typography.caption, color: colors.primary },
  done: { color: colors.success },
  track: { height: 6, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, marginTop: spacing.md, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
  fillDone: { backgroundColor: colors.success },
})
