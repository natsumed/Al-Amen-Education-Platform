import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { colors, radius, spacing, typography } from "../theme"

type Props = {
  title: string
  subtitle?: string
}

export function EmptyState({ title, subtitle }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.xxl,
    padding: spacing.xl,
    alignItems: "center",
  },
  title: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    textAlign: "center",
  },
  sub: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  error: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, ...typography.caption },
})
