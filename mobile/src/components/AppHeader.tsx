import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { colors, spacing, typography, radius } from "../theme"
import { t, type Language } from "../lib/i18n"

type Props = {
  title: string
  subtitle?: string
  language: Language
  onToggleLanguage: () => void
  onLogout?: () => void
}

export function AppHeader({ title, subtitle, language, onToggleLanguage, onLogout }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onToggleLanguage} style={styles.chip}>
          <Text style={styles.chipText}>{language === "ar" ? "FR" : "عربي"}</Text>
        </Pressable>
        {onLogout ? (
          <Pressable onPress={onLogout} style={styles.chip}>
            <Text style={styles.chipText}>{t("logout", language)}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  left: { flex: 1, paddingRight: spacing.md },
  title: { ...typography.h1, color: colors.primary },
  sub: { ...typography.caption, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: "row", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: colors.text, fontWeight: "700" },
})
