import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useAuth } from "../../lib/auth-context"
import { getApiBaseUrl, setApiBaseUrlOverride } from "../../lib/api"
import { t } from "../../lib/i18n"
import { Screen } from "../../components/Screen"
import { TextField } from "../../components/TextField"
import { PrimaryButton } from "../../components/PrimaryButton"
import { ErrorBanner } from "../../components/EmptyState"
import { ThemeToggle } from "../../components/ThemeToggle"
import { radius, spacing, typography, useColors } from "../../theme"
import type { RootStackParamList } from "../../navigation/types"

type Props = NativeStackScreenProps<RootStackParamList, "Login">

const API_OVERRIDE_KEY = "alamen_api_base_override"

export function LoginScreen({ navigation }: Props) {
  const { login, language, setLanguage } = useAuth()
  const themeColors = useColors()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [showApi, setShowApi] = useState(false)
  const [apiUrl, setApiUrl] = useState(() => {
    try {
      return getApiBaseUrl()
    } catch {
      return "http://10.0.2.2:3000"
    }
  })

  useEffect(() => {
    void AsyncStorage.getItem(API_OVERRIDE_KEY).then((stored) => {
      if (stored) {
        setApiBaseUrlOverride(stored)
        setApiUrl(stored)
      }
    })
  }, [])

  const saveApiUrl = async () => {
    const cleaned = apiUrl.trim().replace(/\/$/, "")
    if (!/^https?:\/\/.+/.test(cleaned)) {
      setError(language === "ar" ? "رابط API غير صالح" : "URL API invalide (http://…)")
      return
    }
    setApiBaseUrlOverride(cleaned)
    await AsyncStorage.setItem(API_OVERRIDE_KEY, cleaned)
    setError("")
    setShowApi(true)
  }

  const onSubmit = async () => {
    setError("")
    setBusy(true)
    try {
      if (!email.trim() || !password) {
        setError(language === "ar" ? "أدخل البريد وكلمة المرور" : "Saisissez email et mot de passe")
        return
      }
      await login(email.trim(), password)
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : t("loginFailed", language)
      if (msg.includes("joindre") || msg.includes("connecter") || msg.includes("Network")) {
        try {
          msg = `${msg}\nAPI: ${getApiBaseUrl()}`
        } catch {
          msg = `${msg}\nAPI: (non configurée)`
        }
        msg =
          language === "ar"
            ? `${msg}\n\nتأكد أن الخادم يعمل (npm run dev) ثم اضغط مطولاً على الاسم لضبط عنوان API.\nمحاكي: http://10.0.2.2:3000\nهاتف: http://IP-PC:3000`
            : `${msg}\n\nVérifiez que le serveur tourne (npm run dev), puis appui long sur « Amenallah » pour régler l'URL.\nÉmulateur: http://10.0.2.2:3000\nTéléphone: http://IP-PC:3000`
        setShowApi(true)
      }
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  const version = Constants.expoConfig?.version || "1.0.0"

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <Image
            source={require("../../../assets/logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Amenallah"
          />
          <Pressable onLongPress={() => setShowApi((v) => !v)}>
            <Text style={[styles.brand, { color: themeColors.primary }]}>{t("brand", language)}</Text>
          </Pressable>
          <Text style={[styles.sub, { color: themeColors.muted }]}>{t("brandSub", language)}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.topRow}>
            <ThemeToggle />
            <PrimaryButton
              label={language === "ar" ? "FR" : "عربي"}
              variant="ghost"
              onPress={() => setLanguage(language === "ar" ? "fr" : "ar")}
              style={styles.lang}
            />
          </View>

          {error ? <ErrorBanner message={error} /> : null}

          <TextField
            label={t("email", language)}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="student@edutunisia.tn"
            autoCorrect={false}
            textContentType="username"
          />
          <TextField
            label={t("password", language)}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            textContentType="password"
          />

          <PrimaryButton label={t("login", language)} onPress={onSubmit} loading={busy} />
          <PrimaryButton
            label={t("forgotPassword", language)}
            variant="ghost"
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.authLink}
          />
          <PrimaryButton
            label={t("register", language)}
            variant="outline"
            onPress={() => navigation.navigate("Register")}
            style={styles.authLink}
          />

          <Text style={[styles.hint, { color: themeColors.muted }]}>{t("downloadAppHint", language)}</Text>
          <Text style={[styles.debug, { color: themeColors.muted }]}>
            {t("version", language)} {version}
          </Text>
          {(__DEV__ || showApi) && (
            <View style={styles.apiBox}>
              <TextField
                label="API URL"
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <PrimaryButton
                label={language === "ar" ? "حفظ عنوان API" : "Enregistrer l'URL API"}
                variant="outline"
                onPress={saveApiUrl}
              />
              <Text style={[styles.debug, { color: themeColors.muted }]}>
                Active:{" "}
                {(() => {
                  try {
                    return getApiBaseUrl()
                  } catch {
                    return "(non configurée)"
                  }
                })()}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "center", paddingVertical: spacing.xl },
  hero: { alignItems: "center", marginBottom: spacing.xl },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  brand: { ...typography.brand },
  sub: { ...typography.caption, marginTop: spacing.xs },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  lang: { minHeight: 40 },
  authLink: { marginTop: spacing.sm },
  hint: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  debug: {
    ...typography.tiny,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  apiBox: { marginTop: spacing.md },
})
