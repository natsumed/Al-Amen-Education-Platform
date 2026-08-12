import React, { useCallback, useEffect, useRef, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Linking, Pressable, Share, ScrollView } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as WebBrowser from "expo-web-browser"
import { WebView } from "react-native-webview"
import { Ionicons } from "@expo/vector-icons"
import { api, getApiBaseUrl, type ContentItem } from "../../lib/api"
import { submitProgress } from "../../lib/offline-queue"
import { useAuth } from "../../lib/auth-context"
import { contentDescription, contentTitle, t } from "../../lib/i18n"
import { contentTypeLabel, gradeLabel, subjectLabel } from "../../lib/labels"
import { Screen } from "../../components/Screen"
import { PrimaryButton } from "../../components/PrimaryButton"
import { TextField } from "../../components/TextField"
import { ContentCard } from "../../components/ContentCard"
import { ErrorBanner } from "../../components/EmptyState"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import type { CatalogueStackParamList } from "../../navigation/types"

type Props = NativeStackScreenProps<CatalogueStackParamList, "ContentDetail">

/** YouTube/Drive links to WebView-embeddable form (Drive already normalized server-side). */
function toEmbeddable(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?playsinline=1&rel=0&modestbranding=1`
  return url
}

export function ContentDetailScreen({ route, navigation }: Props) {
  const { id } = route.params
  const { token, language } = useAuth()
  const [content, setContent] = useState<(ContentItem & { access?: ContentItem["access"] }) | null>(null)
  const [media, setMedia] = useState<{
    youtubeUrl: string | null
    pdfUrl: string | null
    gifUrl: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [reviewSent, setReviewSent] = useState(false)
  const [related, setRelated] = useState<ContentItem[]>([])
  const [progressPct, setProgressPct] = useState(0)
  const lastSent = useRef(0)

  const sendProgress = useCallback(
    (percent: number) => {
      if (!token) return
      if (percent <= lastSent.current) return
      lastSent.current = percent
      setProgressPct(percent)
      void submitProgress(token, id, percent)
    },
    [token, id]
  )

  const load = useCallback(async () => {
    try {
      setError("")
      const data = await api.getContent(id, token)
      setContent(data)
      navigation.setOptions({ title: contentTitle(data, language) })
      void api
        .listContent({ grade: data.grade, subject: data.subject, limit: 6 }, token)
        .then((result) => setRelated((result.items || []).filter((item) => item.id !== id).slice(0, 6)))
      if (data.access?.canAccess && token) {
        try {
          const m = await api.getMedia(id, token)
          setMedia(m.media)
          sendProgress(10)
        } catch {
          /* locked media */
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [id, token, language, navigation, sendProgress])

  useEffect(() => {
    void load()
  }, [load])

  // Milestone: after ~45s of active viewing, mark meaningful progress.
  useEffect(() => {
    if (!media) return
    const timer = setTimeout(() => sendProgress(50), 45_000)
    return () => clearTimeout(timer)
  }, [media, sendProgress])

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch {
      await Linking.openURL(url)
    }
  }

  const markComplete = () => sendProgress(100)

  const sendReview = async () => {
    if (!token) return
    await api.postReview(token, id, rating, comment.trim() || undefined)
    setReviewSent(true)
    setComment("")
  }

  const openSubscription = () => {
    const parent = navigation.getParent() as
      | { navigate: (name: string, params?: object) => void }
      | undefined
    if (parent) parent.navigate("ProfileTab", { screen: "Subscription" })
    else void Linking.openURL(`${getApiBaseUrl()}/pricing`)
  }

  const shareContent = async () => {
    try {
      await Share.share({
        message: `${content ? contentTitle(content, language) : "Amenallah"} — ${getApiBaseUrl()}/content/${id}`,
      })
    } catch {
      /* dismissed */
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      </Screen>
    )
  }

  if (error || !content) {
    return (
      <Screen>
        <ErrorBanner message={error || "—"} />
        <PrimaryButton label={t("retry", language)} variant="outline" onPress={load} />
      </Screen>
    )
  }

  const title = contentTitle(content, language)
  const description = contentDescription(content, language)
  const canAccess = Boolean(content.access?.canAccess)
  const rawUrl = media?.youtubeUrl || media?.pdfUrl || media?.gifUrl
  const playerUrl = rawUrl ? toEmbeddable(rawUrl) : null

  return (
    <Screen scroll>
      <View style={styles.metaRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{contentTypeLabel(content.contentType, language)}</Text>
        </View>
        <View style={[styles.badge, content.isFree ? styles.free : styles.premium]}>
          <Text style={[styles.badgeText, content.isFree ? styles.freeText : styles.premiumText]}>
            {content.isFree ? t("free", language) : t("premium", language)}
          </Text>
        </View>
        <Pressable style={styles.shareBtn} onPress={shareContent} hitSlop={8}>
          <Ionicons name="share-social-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subMeta}>
        {subjectLabel(content.subject, language)} · {gradeLabel(content.grade, language)}
      </Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {!canAccess && !content.isFree ? (
        <View style={[styles.lock, shadow.card]}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={22} color={colors.warning} />
          </View>
          <Text style={styles.lockText}>{t("locked", language)}</Text>
          <PrimaryButton label={t("subscribe", language)} onPress={openSubscription} style={styles.subscribe} />
        </View>
      ) : null}

      {canAccess && playerUrl ? (
        <>
          <View style={[styles.player, shadow.card]}>
            <WebView
              source={{ uri: playerUrl }}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction
              startInLoadingState
              renderLoading={() => <ActivityIndicator color={colors.primary} style={styles.webLoader} />}
              onError={() => openUrl(playerUrl)}
            />
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(2, progressPct)}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{progressPct}%</Text>
          </View>
          <PrimaryButton label={t("markComplete", language)} onPress={markComplete} style={styles.btn} />
          <PrimaryButton
            label={t("openInBrowser", language)}
            variant="outline"
            onPress={() => openUrl(playerUrl)}
            style={styles.btn}
          />
        </>
      ) : null}

      {canAccess && !playerUrl ? <Text style={styles.hint}>{t("noMedia", language)}</Text> : null}

      {canAccess && token ? (
        <View style={styles.review}>
          <Text style={styles.sectionTitle}>{t("reviews", language)}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} hitSlop={4}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={30}
                  color={star <= rating ? colors.amber : colors.border}
                />
              </Pressable>
            ))}
          </View>
          <TextField label={t("yourComment", language)} value={comment} onChangeText={setComment} multiline />
          <PrimaryButton label={t("sendReview", language)} onPress={sendReview} />
          {reviewSent ? <Text style={styles.success}>{t("saved", language)}</Text> : null}
          {(content.reviews || []).map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <Text style={styles.reviewName}>
                {review.user?.fullName || "Amenallah"} · {review.rating}/5
              </Text>
              {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {related.length ? (
        <View style={styles.related}>
          <Text style={styles.sectionTitle}>{t("relatedContent", language)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {related.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                language={language}
                variant="tile"
                onPress={() => navigation.push("ContentDetail", { id: item.id })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  badge: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { ...typography.tiny, color: colors.primary },
  free: { backgroundColor: colors.successBg },
  freeText: { color: colors.success },
  premium: { backgroundColor: colors.warningBg },
  premiumText: { color: colors.warning },
  shareBtn: { marginLeft: "auto" },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subMeta: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  desc: { ...typography.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  lock: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  lockIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "#fde68a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  lockText: { color: colors.warning, ...typography.bodyBold, textAlign: "center" },
  subscribe: { marginTop: spacing.md, alignSelf: "stretch" },
  player: { height: 240, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000", marginBottom: spacing.md },
  webLoader: { flex: 1 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
  progressLabel: { ...typography.caption, color: colors.muted, width: 40, textAlign: "right" },
  btn: { marginBottom: spacing.md },
  hint: { ...typography.caption, color: colors.muted, textAlign: "center", marginTop: spacing.lg },
  review: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  stars: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  success: { ...typography.caption, color: colors.success, marginTop: spacing.sm },
  reviewItem: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.md },
  reviewName: { ...typography.caption, color: colors.text },
  reviewText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  related: { marginTop: spacing.xl },
})
