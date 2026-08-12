import React from "react"
import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native"
import { radius, spacing, typography, useColors } from "../theme"

type Props = TextInputProps & {
  label: string
}

export function TextField({ label, style, ...rest }: Props) {
  const colors = useColors()
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
})
