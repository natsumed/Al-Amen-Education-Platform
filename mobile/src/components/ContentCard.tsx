import React from "react"
import { Pressable, View, Text, StyleSheet } from "react-native"
import type { ContentItem } from "../lib/api"
import { contentTitle } from "../lib/i18n"
import type { Language } from "../lib/i18n"
import { colors, radius, spacing, typography } from "../theme"
import { t } from "../lib/i18n"

type Props = {
  item: ContentItem
  language: Language
  onPress: () => void
}

export function ContentCard({ item, language, onPress }: Props) {
  const title = contentTitle(item, language)
  const gradeNum = item.grade.replace("GRADE_", "")

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.contentType}</Text>
        </View>
        <View style={[styles.badge, item.isFree ? styles.free : styles.premium]}>
          <Text style={[styles.badgeText, item.isFree ? styles.freeText : styles.premiumText]}>
            {item.isFree ? t("free", language) : t("premium", language)}
          </Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>
        {t("grade", language)} {gradeNum} · {item.subject}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  badgeText: { ...typography.tiny, color: colors.primary },
  free: { backgroundColor: colors.successBg },
  freeText: { color: colors.success },
  premium: { backgroundColor: colors.warningBg },
  premiumText: { color: colors.warning },
  title: { ...typography.bodyBold, color: colors.text, marginBottom: spacing.xs },
  meta: { ...typography.caption, color: colors.muted },
})
