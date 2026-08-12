import React, { useMemo } from "react"
import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { PrimaryButton } from "./PrimaryButton"
import { radius, spacing, typography, useColors, type ThemeColors } from "../theme"

type Props = {
  title: string
  subtitle?: string
  icon?: React.ComponentProps<typeof Ionicons>["name"]
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, subtitle, icon = "sparkles-outline", actionLabel, onAction }: Props) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} variant="outline" style={styles.action} />
      ) : null}
    </View>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.error}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    box: {
      marginTop: spacing.xxl,
      padding: spacing.xl,
      alignItems: "center",
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.bodyBold,
      color: colors.text,
      textAlign: "center",
    },
    sub: {
      ...typography.caption,
      color: colors.muted,
      textAlign: "center",
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    action: { marginTop: spacing.lg, alignSelf: "stretch" },
    error: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.dangerBg,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: { color: colors.danger, ...typography.caption, flex: 1 },
  })
}
