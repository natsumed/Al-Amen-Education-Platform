import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { PrimaryButton } from "./PrimaryButton"
import { colors, radius, spacing, typography } from "../theme"

type Props = { children: React.ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("Uncaught UI error:", error)
  }

  reset = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <View style={styles.root}>
        <View style={styles.icon}>
          <Ionicons name="warning-outline" size={30} color={colors.warning} />
        </View>
        <Text style={styles.title}>Une erreur est survenue</Text>
        <Text style={styles.sub}>حدث خطأ. أعد المحاولة.</Text>
        <PrimaryButton label="Réessayer" onPress={this.reset} style={styles.btn} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.warningBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2, color: colors.text, textAlign: "center" },
  sub: { ...typography.caption, color: colors.muted, textAlign: "center", marginTop: spacing.sm },
  btn: { marginTop: spacing.xl, alignSelf: "stretch" },
})
