import React, { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { t, type Language } from "../lib/i18n"
import { radius, spacing, typography, useColors, type ThemeColors } from "../theme"

export function OfflineBanner({
  visible,
  language,
  mode = "cache",
}: {
  visible: boolean
  language: Language
  mode?: "cache" | "network"
}) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  if (!visible) return null
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>{t(mode === "network" ? "offline" : "offlineData", language)}</Text>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.warningBg,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    text: { ...typography.tiny, color: colors.warning, flex: 1 },
  })
}
