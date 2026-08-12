import React, { useCallback, useMemo, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { useAuth } from "../../lib/auth-context"
import { greeting, t } from "../../lib/i18n"
import { contentTypeIcon, subjectLabel } from "../../lib/labels"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { ContentCard } from "../../components/ContentCard"
import { ErrorBanner } from "../../components/EmptyState"
import { OfflineBanner } from "../../components/OfflineBanner"
import { useIsOnline } from "../../lib/use-network"
import { getApiBaseUrl } from "../../lib/api"
import { api, type ContentItem, type ProgressItem, type Subscription } from "../../lib/api"
import { radius, shadow, spacing, typography, useColors, type ThemeColors } from "../../theme"
import type { LearnerTabParamList } from "../../navigation/types"

function resolveThumb(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith("http")) return url
  try {
    return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`
  } catch {
    return null
  }
}

export function StudentHomeScreen() {
  const { user, token, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<BottomTabNavigationProp<LearnerTabParamList>>()
  const online = useIsOnline()
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [recommended, setRecommended] = useState<ContentItem[]>([])
  const [invitations, setInvitations] = useState<
    Array<{ id: string; parent: { fullName: string; email: string } }>
  >([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!token) return
    try {
      setError("")
      // allSettled: one flaky endpoint must not wipe the whole home dashboard
      const [progressRes, subscriptionRes, invitationRes, contentRes] = await Promise.allSettled([
        api.getProgress(token),
        api.getSubscription(token),
        api.getInvitations(token),
        api.listContent({ isFree: "true", limit: 8 }, token),
      ])

      if (progressRes.status === "fulfilled") setProgress(progressRes.value.items || [])
      if (subscriptionRes.status === "fulfilled") setSubscription(subscriptionRes.value.subscription)
      if (invitationRes.status === "fulfilled") setInvitations(invitationRes.value.invitations || [])
      if (contentRes.status === "fulfilled") setRecommended(contentRes.value.items || [])

      const failures = [progressRes, subscriptionRes, invitationRes, contentRes].filter(
        (r) => r.status === "rejected"
      )
      if (failures.length === 4) {
        const reason = (failures[0] as PromiseRejectedResult).reason
        setError(reason instanceof Error ? reason.message : t("apiDown", language))
      } else if (failures.length > 0) {
        // Partial success — keep data, show a soft warning only if progress failed
        if (progressRes.status === "rejected") {
          const reason = progressRes.reason
          setError(reason instanceof Error ? reason.message : t("apiDown", language))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("apiDown", language))
    } finally {
      setRefreshing(false)
    }
  }, [token, language])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0
  const inProgress = progress.filter((item) => !item.completed)
  const completed = progress.filter((item) => item.completed).length
  const roleLabel = user?.role === "TEACHER" ? t("teacher", language) : t("student", language)

  const respond = async (linkId: string, action: "ACCEPT" | "REJECT") => {
    if (!token) return
    await api.respondInvitation(token, linkId, action)
    setInvitations((current) => current.filter((item) => item.id !== linkId))
  }

  const openContent = (id: string) =>
    navigation.navigate("CatalogueTab", { screen: "ContentDetail", params: { id } })
  const openSubscription = () => navigation.navigate("ProfileTab", { screen: "Subscription" })

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void load()
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.pad}>
          <AppHeader
            title={t("brand", language)}
            language={language}
            onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
            onLogout={logout}
          />
          <OfflineBanner visible={!online} language={language} mode="network" />
        </View>

        <View style={styles.pad}>
          <View style={[styles.hero, shadow.card]}>
            <View style={styles.rolePill}>
              <Ionicons name="school" size={12} color={colors.primary} />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
            <Text style={styles.greeting}>
              {greeting(language)}, {user?.fullName?.split(" ")[0]}
            </Text>
            <Text style={styles.greetingSub}>{t("continueLearning", language)}</Text>

            <Pressable style={styles.subCard} onPress={openSubscription}>
              <View style={styles.subInfo}>
                <Text style={styles.subLabel}>
                  {subscription ? t("activePlan", language) : t("freePlan", language)}
                </Text>
                <Text style={styles.subValue}>
                  {subscription
                    ? `${subscription.plan.replaceAll("_", " ")} · ${daysLeft} ${t("daysRemaining", language)}`
                    : t("subscribe", language)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.pad}>
            <ErrorBanner message={error} />
          </View>
        ) : null}

        <View style={[styles.pad, styles.statsRow]}>
          <Stat icon="book" value={String(progress.length)} label={t("statAccessed", language)} />
          <Stat icon="checkmark-done" value={String(completed)} label={t("statCompleted", language)} />
          <Stat icon="time" value={String(inProgress.length)} label={t("statInProgress", language)} />
        </View>

        {invitations.length ? (
          <View style={styles.pad}>
            <Text style={styles.sectionTitle}>{t("invitations", language)}</Text>
            {invitations.map((invitation) => (
              <View key={invitation.id} style={[styles.invitation, shadow.card]}>
                <Text style={styles.invitationName}>{invitation.parent.fullName}</Text>
                <Text style={styles.invitationEmail}>{invitation.parent.email}</Text>
                <View style={styles.invitationActions}>
                  <Pressable onPress={() => respond(invitation.id, "ACCEPT")} style={styles.accept}>
                    <Text style={styles.acceptText}>{t("accept", language)}</Text>
                  </Pressable>
                  <Pressable onPress={() => respond(invitation.id, "REJECT")} style={styles.reject}>
                    <Text style={styles.rejectText}>{t("reject", language)}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {inProgress.length ? (
          <View style={styles.section}>
            <SectionHeader
              title={t("continueSection", language)}
              actionLabel={t("seeAll", language)}
              onAction={() => navigation.navigate("MyCoursesTab")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {inProgress.slice(0, 8).map((item) => (
                <ContinueTile
                  key={item.id}
                  item={item}
                  language={language}
                  onPress={() => openContent(item.contentId)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {recommended.length ? (
          <View style={styles.section}>
            <SectionHeader
              title={t("freeForYou", language)}
              actionLabel={t("seeAll", language)}
              onAction={() => navigation.navigate("CatalogueTab")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {recommended.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  language={language}
                  variant="tile"
                  onPress={() => openContent(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {user?.publicId ? (
          <View style={styles.pad}>
            <View style={styles.idBox}>
              <Text style={styles.idLabel}>{t("accountNumber", language)}</Text>
              <Text style={styles.idValue}>{user.publicId}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  )
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={[styles.stat, shadow.card]}>
      <Ionicons name={icon as never} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel: string
  onAction: () => void
}) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={[styles.pad, styles.sectionHeader]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={styles.seeAll}>{actionLabel}</Text>
      </Pressable>
    </View>
  )
}

function ContinueTile({
  item,
  language,
  onPress,
}: {
  item: ProgressItem
  language: string
  onPress: () => void
}) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const thumb = resolveThumb(item.content.thumbnailUrl)
  const lang = language as "fr" | "ar"
  const title = lang === "ar" ? item.content.titleAr : item.content.titleFr
  return (
    <Pressable onPress={onPress} style={[styles.tile, shadow.card]}>
      <View style={styles.tileThumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.tileImage} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name={contentTypeIcon(item.content.contentType) as never} size={28} color={colors.primary} />
        )}
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.tileMeta} numberOfLines={1}>
        {subjectLabel(item.content.subject, lang)}
      </Text>
      <View style={styles.tileTrack}>
        <View style={[styles.tileFill, { width: `${Math.max(3, item.progressPercent)}%` }]} />
      </View>
    </Pressable>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  content: { paddingBottom: spacing.xxl },
  pad: { paddingHorizontal: spacing.lg },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  greeting: { ...typography.h1, color: colors.text },
  greetingSub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  subCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  subInfo: { flex: 1 },
  subLabel: { ...typography.tiny, color: colors.primary },
  subValue: { ...typography.bodyBold, color: colors.text, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statValue: { ...typography.h2, color: colors.text },
  statLabel: { ...typography.tiny, color: colors.muted },
  section: { marginTop: spacing.xl },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  seeAll: { ...typography.caption, color: colors.primary },
  rail: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  tile: {
    width: 180,
    marginRight: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  tileThumb: {
    height: 92,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  tileImage: { width: "100%", height: "100%" },
  tileTitle: { ...typography.bodyBold, color: colors.text },
  tileMeta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  tileTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  tileFill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
  invitation: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  invitationName: { ...typography.bodyBold, color: colors.text },
  invitationEmail: { ...typography.caption, color: colors.muted },
  invitationActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  accept: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  acceptText: { ...typography.caption, color: "#fff" },
  reject: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  rejectText: { ...typography.caption, color: colors.danger },
  idBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idLabel: { ...typography.caption, color: colors.muted },
  idValue: { ...typography.h2, color: colors.primary, marginTop: 4, letterSpacing: 2 },
})
}
