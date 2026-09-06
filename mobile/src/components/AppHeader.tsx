import React from "react"
import { View, Text, Pressable, StyleSheet, Image } from "react-native"
import { spacing, typography, radius, useColors } from "../theme"
import { ThemeToggle } from "./ThemeToggle"
import { isRTL, t, type Language } from "../lib/i18n"

type Props = {
  title: string
  subtitle?: string
  language: Language
  onToggleLanguage?: () => void
  onLogout?: () => void
  showLogo?: boolean
  /** Default off — use Settings for theme to avoid chrome on every screen */
  showThemeToggle?: boolean
  /** Default off — use Settings / Profile for language */
  showLanguageToggle?: boolean
}

/**
 * Compact brand header. Prefer minimal actions on learning tabs;
 * put theme/lang/logout on Profile / Settings.
 */
export function AppHeader({
  title,
  subtitle,
  language,
  onToggleLanguage,
  onLogout,
  showLogo = true,
  showThemeToggle = false,
  showLanguageToggle = false,
}: Props) {
  const colors = useColors()
  const rtl = isRTL(language)
  const hasActions = showThemeToggle || (showLanguageToggle && onToggleLanguage) || onLogout

  return (
    <View style={[styles.header, rtl && styles.headerRtl]}>
      <View style={[styles.left, rtl && styles.leftRtl]}>
        {showLogo ? (
          <Image
            source={require("../../assets/logo.jpeg")}
            style={[styles.logo, rtl ? styles.logoRtl : styles.logoLtr]}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.titles}>
          <Text style={[styles.title, { color: colors.primary }, rtl && styles.rtlText]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: colors.muted }, rtl && styles.rtlText]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {hasActions ? (
        <View style={styles.actions}>
          {showThemeToggle ? <ThemeToggle /> : null}
          {showLanguageToggle && onToggleLanguage ? (
            <Pressable
              onPress={onToggleLanguage}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>
                {language === "ar" ? "FR" : "عربي"}
              </Text>
            </Pressable>
          ) : null}
          {onLogout ? (
            <Pressable
              onPress={onLogout}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>{t("logout", language)}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerRtl: { flexDirection: "row-reverse" },
  left: { flex: 1, flexDirection: "row", alignItems: "center", paddingRight: spacing.md },
  leftRtl: { flexDirection: "row-reverse", paddingRight: 0, paddingLeft: spacing.md },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
  },
  logoLtr: { marginRight: spacing.sm },
  logoRtl: { marginLeft: spacing.sm },
  rtlText: { textAlign: "right", writingDirection: "rtl" },
  titles: { flex: 1 },
  title: { ...typography.h2 },
  sub: { ...typography.caption, marginTop: 2 },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    flexShrink: 0,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, fontWeight: "700" },
})
