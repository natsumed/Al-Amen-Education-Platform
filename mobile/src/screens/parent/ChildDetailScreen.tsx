import React, { useCallback, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Linking } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { api, getApiBaseUrl } from "../../lib/api"
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
    fullName: string
    email: string
    publicId?: string
    progress: ChildProgress[]
  } | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await api.parentChildren(token)
      const link = (data.links || []).find((item) => item.id === linkId)
      if (link) {
        setChild({
          fullName: link.student.fullName,
          email: link.student.email,
          publicId: link.student.publicId,
          progress: (link.student.progress || []) as ChildProgress[],
        })
        navigation.setOptions({ title: link.student.fullName })
      }
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

  const openPay = () => {
    try {
      void Linking.openURL(`${getApiBaseUrl()}/parent/pay`)
    } catch {
      /* ignore */
    }
  }

  return (
    <Screen scroll>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.name}>{child.fullName}</Text>
        <Text style={styles.email}>{child.email}</Text>
        {child.publicId ? <Text style={styles.pid}>#{child.publicId}</Text> : null}
      </View>

      <PrimaryButton label={t("payOnWeb", language)} onPress={openPay} style={styles.pay} />

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
