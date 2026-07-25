import React from "react"
import { Pressable, Text, StyleSheet } from "react-native"
import { colors, radius, spacing, typography } from "../theme"

type Props = {
  label: string
  active?: boolean
  onPress: () => void
}

export function GradeChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: { ...typography.caption, color: colors.muted },
  textActive: { color: "#fff" },
})
