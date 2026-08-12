import React, { useEffect, useRef } from "react"
import { Animated, Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAppTheme } from "../theme/theme-context"

type Props = {
  /** Optional accessibility label override */
  label?: string
}

/**
 * Sliding sun / moon switch — tap to flip light ↔ dark.
 */
export function ThemeToggle({ label }: Props) {
  const { isDark, toggleScheme, colors } = useAppTheme()
  const slide = useRef(new Animated.Value(isDark ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(slide, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 80,
    }).start()
  }, [isDark, slide])

  const thumbLeft = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 31],
  })

  return (
    <Pressable
      onPress={toggleScheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={label || (isDark ? "Mode sombre" : "Mode clair")}
      style={[
        styles.track,
        {
          backgroundColor: isDark ? colors.primarySoft : colors.border,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.icons} pointerEvents="none">
        <Ionicons name="sunny" size={14} color={isDark ? colors.muted : "#f59e0b"} />
        <Ionicons name="moon" size={14} color={isDark ? colors.primary : colors.muted} />
      </View>
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.surface,
            left: thumbLeft,
            shadowColor: colors.text,
          },
        ]}
      >
        <Ionicons
          name={isDark ? "moon" : "sunny"}
          size={16}
          color={isDark ? colors.primary : "#f59e0b"}
        />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: 62,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  icons: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  thumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
})
