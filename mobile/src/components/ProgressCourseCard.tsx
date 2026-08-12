import React, { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import type { ProgressItem } from "../lib/api"
import { getApiBaseUrl } from "../lib/api"
import { contentTitle, t, type Language } from "../lib/i18n"
import { contentTypeIcon, gradeLabel, subjectLabel } from "../lib/labels"
import { radius, shadow, spacing, typography, useColors, type ThemeColors } from "../theme"

type Props = {
  item: ProgressItem
  language: Language
  onPress: () => void
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

export function ProgressCourseCard({ item, language, onPress }: Props) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const thumb = resolveThumb(item.content.thumbnailUrl)
  const pct = Math.max(0, Math.min(100, item.progressPercent))

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.root, shadow.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.thumb}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.image} contentFit="cover" transition={200} />
          ) : (
            <Ionicons name={contentTypeIcon(item.content.contentType) as never} size={22} color={colors.primary} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {contentTitle(item.content, language)}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {subjectLabel(item.content.subject, language)} · {gradeLabel(item.content.grade, language)}
          </Text>
        </View>
        <View style={[styles.statusPill, item.completed ? styles.donePill : styles.progressPill]}>
          <Text style={[styles.status, item.completed && styles.done]}>
            {item.completed ? t("completed", language) : `${pct}%`}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(3, pct)}%` }, item.completed && styles.fillDone]} />
      </View>
    </Pressable>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    pressed: { opacity: 0.9 },
    top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    info: { flex: 1 },
    title: { ...typography.bodyBold, color: colors.text },
    meta: { ...typography.caption, color: colors.muted, marginTop: 2 },
    statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
    progressPill: { backgroundColor: colors.primarySoft },
    donePill: { backgroundColor: colors.successBg },
    status: { ...typography.tiny, color: colors.primary },
    done: { color: colors.success },
    track: {
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceAlt,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
    fillDone: { backgroundColor: colors.success },
  })
}
