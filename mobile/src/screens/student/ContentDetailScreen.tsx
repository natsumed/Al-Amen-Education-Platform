import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Linking } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as WebBrowser from "expo-web-browser"
import { api, type ContentItem } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { contentDescription, contentTitle, t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { PrimaryButton } from "../../components/PrimaryButton"
import { ErrorBanner } from "../../components/EmptyState"
import { colors, radius, spacing, typography } from "../../theme"
import type { CatalogueStackParamList } from "../../navigation/types"

type Props = NativeStackScreenProps<CatalogueStackParamList, "ContentDetail">

export function ContentDetailScreen({ route, navigation }: Props) {
  const { id } = route.params
  const { token, language } = useAuth()
  const [content, setContent] = useState<(ContentItem & { access?: ContentItem["access"] }) | null>(
    null
  )
  const [media, setMedia] = useState<{
    youtubeUrl: string | null
    pdfUrl: string | null
    gifUrl: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const data = await api.getContent(id, token)
        setContent(data)
        navigation.setOptions({ title: contentTitle(data, language) })
        if (data.access?.canAccess && token) {
          try {
            const m = await api.getMedia(id, token)
            setMedia(m.media)
          } catch {
            /* locked */
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error")
      } finally {
        setLoading(false)
      }
    })()
  }, [id, token, language, navigation])

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url)
    } catch {
      await Linking.openURL(url)
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
      </Screen>
    )
  }

  const title = contentTitle(content, language)
  const description = contentDescription(content, language)
  const canAccess = Boolean(content.access?.canAccess)

  return (
    <Screen scroll>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{content.contentType}</Text>
        </View>
        <View style={[styles.badge, content.isFree ? styles.free : styles.premium]}>
          <Text style={styles.badgeText}>
            {content.isFree ? t("free", language) : t("premium", language)}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}

      {!canAccess && !content.isFree ? (
        <View style={styles.lock}>
          <Text style={styles.lockText}>{t("locked", language)}</Text>
        </View>
      ) : null}

      {canAccess && media?.youtubeUrl ? (
        <PrimaryButton
          label={t("openVideo", language)}
          onPress={() => openUrl(media.youtubeUrl!)}
          style={styles.btn}
        />
      ) : null}
      {canAccess && media?.pdfUrl ? (
        <PrimaryButton
          label={t("openPdf", language)}
          onPress={() => openUrl(media.pdfUrl!)}
          style={styles.btn}
        />
      ) : null}
      {canAccess && media?.gifUrl ? (
        <PrimaryButton
          label={t("openAnim", language)}
          onPress={() => openUrl(media.gifUrl!)}
          style={styles.btn}
        />
      ) : null}

      {canAccess && !media?.youtubeUrl && !media?.pdfUrl && !media?.gifUrl ? (
        <Text style={styles.hint}>{t("noMedia", language)}</Text>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  free: { backgroundColor: colors.successBg },
  premium: { backgroundColor: colors.warningBg },
  badgeText: { ...typography.tiny, color: colors.primary },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.md },
  desc: { ...typography.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.xl },
  lock: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  lockText: { color: colors.warning, ...typography.bodyBold },
  btn: { marginBottom: spacing.md },
  hint: { ...typography.caption, color: colors.muted, textAlign: "center", marginTop: spacing.lg },
})
