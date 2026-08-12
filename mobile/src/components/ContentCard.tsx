import React, { useMemo } from "react"
import { Pressable, View, Text, StyleSheet } from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import type { ContentItem } from "../lib/api"
import { contentTitle, t, type Language } from "../lib/i18n"
import { contentTypeIcon, contentTypeLabel, gradeLabel, subjectLabel } from "../lib/labels"
import { getApiBaseUrl } from "../lib/api"
import { radius, spacing, typography, shadow, useColors, type ThemeColors } from "../theme"

type Props = {
  item: ContentItem
  language: Language
  onPress: () => void
  variant?: "row" | "tile"
}

function resolveThumb(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith("http")) return url
  try {
    return `${getApiBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`
  } catch {
    return null
  }
}

export function ContentCard({ item, language, onPress, variant = "row" }: Props) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const title = contentTitle(item, language)
  const thumb = resolveThumb(item.thumbnailUrl)
  const locked = Boolean(item.access && !item.access.canAccess)
  const isTile = variant === "tile"

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isTile ? styles.tile : styles.row,
        shadow.card,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={[styles.thumb, isTile ? styles.thumbTile : styles.thumbRow]}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={styles.thumbFallback}>
            <Ionicons
              name={contentTypeIcon(item.contentType) as never}
              size={isTile ? 30 : 24}
              color={colors.primary}
            />
          </View>
        )}
        {locked ? (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color="#fff" />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.type}>{contentTypeLabel(item.contentType, language)}</Text>
          <View style={styles.dot} />
          <Text style={styles.type}>{gradeLabel(item.grade, language)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.subject}>{subjectLabel(item.subject, language)}</Text>
          <View style={[styles.badge, item.isFree ? styles.free : styles.premium]}>
            <Text style={[styles.badgeText, item.isFree ? styles.freeText : styles.premiumText]}>
              {item.isFree ? t("free", language) : t("premium", language)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: { flexDirection: "row", marginBottom: spacing.md },
    tile: { width: 220, marginRight: spacing.md },
    thumb: { backgroundColor: colors.primarySoft, position: "relative" },
    thumbRow: { width: 96 },
    thumbTile: { width: "100%", height: 120 },
    image: { width: "100%", height: "100%" },
    thumbFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
    lockBadge: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.sm,
      backgroundColor: colors.danger,
      width: 22,
      height: 22,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { flex: 1, padding: spacing.md, justifyContent: "center" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs },
    type: { ...typography.tiny, color: colors.primary },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.muted },
    title: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.sm },
    footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
    subject: { ...typography.caption, color: colors.muted, flex: 1 },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
    badgeText: { ...typography.tiny },
    free: { backgroundColor: colors.successBg },
    freeText: { color: colors.success },
    premium: { backgroundColor: colors.warningBg },
    premiumText: { color: colors.warning },
  })
}
