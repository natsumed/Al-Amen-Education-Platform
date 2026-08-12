import React from "react"
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from "react-native"
import { radius, spacing, typography, useColors } from "../theme"

type Props = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: "primary" | "outline" | "ghost"
  style?: ViewStyle
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  style,
}: Props) {
  const colors = useColors()
  const isPrimary = variant === "primary"
  const isOutline = variant === "outline"

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && { backgroundColor: colors.primary },
        isOutline && {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        variant === "ghost" && { backgroundColor: "transparent" },
        (disabled || loading) && styles.disabled,
        pressed && { opacity: 0.88 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary && styles.labelPrimary,
            !isPrimary && { color: colors.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  disabled: { opacity: 0.5 },
  label: { ...typography.bodyBold },
  labelPrimary: { color: "#fff" },
})
