import React, { useState } from "react"
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { AppHeader } from "../../components/AppHeader"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { api } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { colors, radius, shadow, spacing, typography } from "../../theme"

type Message = { id: string; role: "user" | "assistant"; text: string }

export function HelpScreen() {
  const { token, language, setLanguage, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)

  const ask = async (text: string) => {
    if (!token || !text.trim() || busy) return
    const question = text.trim()
    setInput("")
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: "user", text: question }])
    setBusy(true)
    try {
      const result = await api.askHelp(token, question, language)
      setMessages((current) => [...current, { id: `${Date.now()}-a`, role: "assistant", text: result.reply }])
    } catch (e) {
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-e`, role: "assistant", text: e instanceof Error ? e.message : "Error" },
      ])
    } finally {
      setBusy(false)
    }
  }

  const faqs = [t("faqAccess", language), t("faqPay", language), t("faqParent", language)]

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppHeader
          title={t("help", language)}
          language={language}
          onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
          onLogout={logout}
        />
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={styles.intro}>
              <View style={styles.introIcon}>
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
              </View>
              <Text style={styles.introText}>{t("helpIntro", language)}</Text>
              <Text style={styles.faqLabel}>{t("faq", language)}</Text>
              {faqs.map((question) => (
                <Pressable key={question} style={[styles.faq, shadow.card]} onPress={() => ask(question)}>
                  <Text style={styles.faqText}>{question}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.user : styles.assistant]}>
            <Text style={[styles.message, item.role === "user" && styles.userText]}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextField
          label={t("askQuestion", language)}
          value={input}
          onChangeText={setInput}
          multiline
          style={styles.input}
        />
        <PrimaryButton label={t("send", language)} onPress={() => ask(input)} loading={busy} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0 },
  header: { paddingHorizontal: spacing.lg },
  messages: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
  intro: { paddingTop: spacing.md },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  introText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  faqLabel: { ...typography.tiny, color: colors.muted, marginBottom: spacing.sm },
  faq: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqText: { ...typography.bodyBold, color: colors.text, flex: 1 },
  bubble: { maxWidth: "86%", padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm },
  user: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistant: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  message: { ...typography.body, color: colors.text },
  userText: { color: "#fff" },
  composer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  input: { maxHeight: 90 },
})
