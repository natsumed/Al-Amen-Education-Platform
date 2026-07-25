import React from "react"
import { View, StyleSheet, type ViewStyle, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, spacing } from "../theme"

type Props = {
  children: React.ReactNode
  scroll?: boolean
  style?: ViewStyle
  edges?: ("top" | "bottom" | "left" | "right")[]
}

export function Screen({ children, scroll, style, edges = ["top", "bottom"] }: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  )

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {body}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
})
