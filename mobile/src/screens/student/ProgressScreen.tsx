import React from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { AppHeader } from "../../components/AppHeader"
import { EmptyState } from "../../components/EmptyState"
import { CardSkeletonList } from "../../components/Skeleton"
import { ProgressCourseCard } from "../../components/ProgressCourseCard"
import { Screen } from "../../components/Screen"
import { useProgress } from "../../features/progress/use-progress"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { subjectLabel } from "../../lib/labels"
import type { LearnerTabParamList } from "../../navigation/types"
import { colors, radius, spacing, typography } from "../../theme"

export function ProgressScreen() {
  const { language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<BottomTabNavigationProp<LearnerTabParamList>>()
  const { items, loading } = useProgress()

  const completed = items.filter((item) => item.completed).length
  const inProgress = items.length - completed
  const average = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length)
    : 0

  const bySubject = new Map<string, { sum: number; count: number }>()
  items.forEach((item) => {
    const key = item.content.subject
    const entry = bySubject.get(key) || { sum: 0, count: 0 }
    entry.sum += item.progressPercent
    entry.count += 1
    bySubject.set(key, entry)
  })
  const subjects = Array.from(bySubject.entries())
    .map(([subject, { sum, count }]) => ({ subject, avg: Math.round(sum / count), count }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <Screen scroll>
      <AppHeader
        title={t("progress", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />

      <View style={styles.stats}>
        <Stat value={String(items.length)} label={t("statAccessed", language)} />
        <Stat value={String(completed)} label={t("statCompleted", language)} />
        <Stat value={String(inProgress)} label={t("statInProgress", language)} />
      </View>

      <View style={styles.avgCard}>
        <View style={styles.avgHeader}>
          <Text style={styles.avgLabel}>{t("avgProgress", language)}</Text>
          <Text style={styles.avgValue}>{average}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(2, average)}%` }]} />
        </View>
      </View>

      {loading ? (
        <CardSkeletonList count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title={t("emptyProgressTitle", language)}
          actionLabel={t("emptyProgressCta", language)}
          onAction={() => navigation.navigate("CatalogueTab")}
        />
      ) : (
        <>
          {subjects.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("bySubject", language)}</Text>
              {subjects.map((row) => (
                <View key={row.subject} style={styles.subjectRow}>
                  <Text style={styles.subjectName} numberOfLines={1}>
                    {subjectLabel(row.subject, language)}
                  </Text>
                  <View style={styles.subjectTrack}>
                    <View style={[styles.subjectFill, { width: `${Math.max(3, row.avg)}%` }]} />
                  </View>
                  <Text style={styles.subjectPct}>{row.avg}%</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("myCourses", language)}</Text>
            {items.map((item) => (
              <ProgressCourseCard
                key={item.id}
                item={item}
                language={language}
                onPress={() =>
                  navigation.navigate("CatalogueTab", {
                    screen: "ContentDetail",
                    params: { id: item.contentId },
                  })
                }
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statValue: { ...typography.h1, color: colors.primary },
  statLabel: { ...typography.tiny, color: colors.muted, marginTop: 2 },
  avgCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avgHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  avgLabel: { ...typography.bodyBold, color: colors.text },
  avgValue: { ...typography.h2, color: colors.primary },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, marginTop: spacing.md, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  subjectName: { ...typography.caption, color: colors.text, width: 96 },
  subjectTrack: { flex: 1, height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  subjectFill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.accent },
  subjectPct: { ...typography.tiny, color: colors.muted, width: 34, textAlign: "right" },
})
