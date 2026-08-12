import React, { useEffect, useMemo, useRef } from "react"
import { Animated, StyleSheet, View, type ViewStyle } from "react-native"
import { radius, spacing, useColors, type ThemeColors } from "../theme"

export function Skeleton({ style }: { style?: ViewStyle }) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return <Animated.View style={[styles.base, style, { opacity }]} />
}

export function CardSkeletonList({ count = 5 }: { count?: number }) {
  const colors = useColors()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} style={styles.card} />
      ))}
    </View>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: { backgroundColor: colors.border, borderRadius: radius.sm },
    list: { paddingHorizontal: spacing.lg, gap: spacing.md },
    card: { height: 96, borderRadius: radius.lg, marginBottom: spacing.md },
  })
}
