import React, { useState } from "react"
import { StyleSheet, Switch, Text, View } from "react-native"
import { Image } from "expo-image"
import * as ImagePicker from "expo-image-picker"
import { AppHeader } from "../../components/AppHeader"
import { ErrorBanner } from "../../components/EmptyState"
import { GradeChip } from "../../components/GradeChip"
import { PrimaryButton } from "../../components/PrimaryButton"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { ThemeToggle } from "../../components/ThemeToggle"
import { api, getApiBaseUrl, uploadAvatar } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"
import { t } from "../../lib/i18n"
import { radius, shadow, spacing, typography, useColors } from "../../theme"
import { enableLearningNotifications } from "../../lib/notifications"

export function SettingsScreen() {
  const { user, token, language, setLanguage, logout, updateUser } = useAuth()
  const themeColors = useColors()
  const [fullName, setFullName] = useState(user?.fullName || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [notifications, setNotifications] = useState(user?.emailNotifications ?? true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!token) return
    setBusy(true)
    setError("")
    try {
      const result = await api.updateProfile(token, {
        fullName,
        phone,
        preferredLanguage: language,
        emailNotifications: notifications,
      })
      updateUser(result.user)
      setMessage(t("saved", language))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const chooseAvatar = async () => {
    if (!token) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled) return
    setBusy(true)
    try {
      const uploaded = await uploadAvatar(token, result.assets[0])
      updateUser(uploaded.user)
      setMessage(t("saved", language))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async () => {
    if (!token) return
    setBusy(true)
    setError("")
    try {
      const result = await api.changePassword(token, { currentPassword, newPassword, confirmPassword })
      setMessage(result.message || t("saved", language))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const enablePush = async () => {
    const granted = await enableLearningNotifications()
    setMessage(granted ? t("notificationsOn", language) : t("notificationsDenied", language))
  }

  const avatar = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${getApiBaseUrl()}${user.avatarUrl}`
    : null

  return (
    <Screen scroll>
      <AppHeader
        title={t("settings", language)}
        language={language}
        onToggleLanguage={() => setLanguage(language === "ar" ? "fr" : "ar")}
        onLogout={logout}
      />
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <Text style={[styles.success, { color: themeColors.success }]}>{message}</Text> : null}

      <Text style={[styles.section, { color: themeColors.muted }]}>{t("account", language)}</Text>
      <View
        style={[
          styles.card,
          shadow.card,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <View style={styles.avatarRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: themeColors.primary },
              ]}
            >
              <Text style={styles.avatarLetter}>{(fullName || "?").slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <PrimaryButton label={t("changePhoto", language)} variant="outline" onPress={chooseAvatar} />
        </View>
        <TextField label={t("fullName", language)} value={fullName} onChangeText={setFullName} />
        <TextField label={t("phone", language)} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <PrimaryButton label={t("save", language)} onPress={save} loading={busy} />
      </View>

      <Text style={[styles.section, { color: themeColors.muted }]}>{t("preferences", language)}</Text>
      <View
        style={[
          styles.card,
          shadow.card,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={[styles.rowLabel, { color: themeColors.text }]}>{t("appearance", language)}</Text>
            <Text style={[styles.hint, { color: themeColors.muted }]}>{t("appearanceHint", language)}</Text>
          </View>
          <ThemeToggle />
        </View>
        <Text style={[styles.rowLabel, { color: themeColors.text, marginTop: spacing.lg }]}>
          {t("language", language)}
        </Text>
        <View style={styles.segment}>
          <GradeChip label="Français" active={language === "fr"} onPress={() => setLanguage("fr")} />
          <GradeChip label="العربية" active={language === "ar"} onPress={() => setLanguage("ar")} />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.rowLabel, { color: themeColors.text }]}>
            {t("emailNotifications", language)}
          </Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ true: themeColors.primary }}
          />
        </View>
        <PrimaryButton
          label={t("enableNotifications", language)}
          variant="outline"
          onPress={enablePush}
          style={styles.spaced}
        />
      </View>

      <Text style={[styles.section, { color: themeColors.muted }]}>{t("security", language)}</Text>
      <View
        style={[
          styles.card,
          shadow.card,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        ]}
      >
        <TextField
          label={t("currentPassword", language)}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextField
          label={t("newPassword", language)}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextField
          label={t("confirmPassword", language)}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <PrimaryButton label={t("changePassword", language)} onPress={changePassword} loading={busy} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  success: { ...typography.caption, marginBottom: spacing.md },
  section: {
    ...typography.tiny,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.full },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarLetter: { color: "#fff", fontFamily: "Cairo_800ExtraBold", fontSize: 26 },
  rowLabel: { ...typography.body },
  segment: { flexDirection: "row", marginTop: spacing.sm, marginBottom: spacing.md },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  hint: { ...typography.caption, marginTop: 2 },
  spaced: { marginTop: spacing.md },
})
