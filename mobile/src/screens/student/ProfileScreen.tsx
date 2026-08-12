import React, { useCallback, useState } from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import * as Clipboard from "expo-clipboard"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useAuth } from "../../lib/auth-context"
import { api, getApiBaseUrl, type Subscription } from "../../lib/api"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { AppHeader } from "../../components/AppHeader"
import { colors, radius, shadow, spacing, typography } from "../../theme"
import type { ProfileStackParamList } from "../../navigation/types"

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith("http")) return avatarUrl
  try {
    return `${getApiBaseUrl()}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`
  } catch {
    return null
  }
}

export function ProfileScreen() {
  const { user, token, language, setLanguage, logout } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>()
  const avatar = resolveAvatarUrl(user?.avatarUrl)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [copied, setCopied] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      void api.getSubscription(token).then((data) => setSubscription(data.subscription)).catch(() => {})
    }, [token])
  )

  const roleLabel =
    user?.role === "TEACHER" ? t("teacher", language) : user?.role === "PARENT" ? t("parent", language) : t("student", language)
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86_400_000))
    : 0

  const copyId = async () => {
    if (!user?.publicId) return
    await Clipboard.setStringAsync(user.publicId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Screen scroll>
      <AppHeader
        title={t("profile", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />

      <View style={[styles.card, shadow.card]}>
        <View style={styles.row}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarLetter}>{(user?.fullName || "?").slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {user?.publicId ? (
          <Pressable style={styles.idRow} onPress={copyId}>
            <View>
              <Text style={styles.idLabel}>{t("accountNumber", language)}</Text>
              <Text style={styles.idValue}>{user.publicId}</Text>
            </View>
            <View style={styles.copyBtn}>
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={colors.primary} />
              <Text style={styles.copyText}>{copied ? t("copied", language) : t("copyId", language)}</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      <Pressable style={[styles.link, shadow.card]} onPress={() => navigation.navigate("Subscription")}>
        <View style={styles.linkLeft}>
          <View style={styles.linkIcon}>
            <Ionicons name="card-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.linkText}>{t("subscription", language)}</Text>
            <Text style={styles.linkSub}>
              {subscription
                ? `${subscription.plan.replaceAll("_", " ")} · ${daysLeft} ${t("daysRemaining", language)}`
                : t("freePlan", language)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      <Row icon="settings-outline" label={t("settings", language)} onPress={() => navigation.navigate("Settings")} />
      <Row icon="help-circle-outline" label={t("help", language)} onPress={() => navigation.navigate("Help")} />
    </Screen>
  )
}

function Row({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.link, shadow.card]} onPress={onPress}>
      <View style={styles.linkLeft}>
        <View style={styles.linkIcon}>
          <Ionicons name={icon as never} size={18} color={colors.primary} />
        </View>
        <Text style={styles.linkText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#fff", fontFamily: "Cairo_800ExtraBold", fontSize: 24 },
  name: { ...typography.h2, color: colors.text },
  email: { ...typography.caption, color: colors.muted, marginTop: 2 },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  roleText: { ...typography.tiny, color: colors.primary },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  idLabel: { ...typography.caption, color: colors.muted },
  idValue: { ...typography.h2, color: colors.primary, letterSpacing: 2, marginTop: 2 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  copyText: { ...typography.tiny, color: colors.primary },
  link: {
    marginTop: spacing.md,
    minHeight: 60,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: { ...typography.bodyBold, color: colors.text },
  linkSub: { ...typography.caption, color: colors.muted, marginTop: 2 },
})
