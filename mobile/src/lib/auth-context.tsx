import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { api, setApiBaseUrlOverride, setAuthRefreshHandler, type MobileUser } from "./api"
import { flushProgressQueue } from "./offline-queue"
import { registerPushToken, unregisterPushToken } from "./notifications"

const LEGACY_TOKEN_KEY = "alamen_mobile_token"
const ACCESS_TOKEN_KEY = "alamen_access_token"
const REFRESH_TOKEN_KEY = "alamen_refresh_token"
const DEVICE_ID_KEY = "alamen_device_id"
const LANGUAGE_KEY = "alamen_mobile_language"
const API_OVERRIDE_KEY = "alamen_api_base_override"

type AuthContextValue = {
  user: MobileUser | null
  token: string | null
  loading: boolean
  language: "fr" | "ar"
  setLanguage: (lang: "fr" | "ar") => void
  login: (email: string, password: string, totpCode?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (user: MobileUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<"fr" | "ar">("fr")

  const clearCredentials = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
    ])
    setToken(null)
    setUser(null)
  }, [])

  const rotateAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
    if (!refreshToken) return null
    try {
      const rotated = await api.refresh(refreshToken)
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, rotated.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, rotated.refreshToken),
      ])
      setToken(rotated.accessToken)
      return rotated.accessToken
    } catch {
      await clearCredentials()
      return null
    }
  }, [clearCredentials])

  useEffect(() => {
    setAuthRefreshHandler(rotateAccessToken)
    return () => setAuthRefreshHandler(null)
  }, [rotateAccessToken])

  useEffect(() => {
    ;(async () => {
      try {
        const [stored, savedLanguage, apiOverride] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
          AsyncStorage.getItem(API_OVERRIDE_KEY),
        ])
        if (apiOverride) setApiBaseUrlOverride(apiOverride)
        if (savedLanguage === "fr" || savedLanguage === "ar") setLanguage(savedLanguage)
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY)
        const activeToken = stored || await rotateAccessToken()
        if (activeToken) {
          const { user: me } = await api.me(activeToken)
          setToken(activeToken)
          setUser({
            id: me.id,
            email: me.email,
            fullName: me.fullName,
            role: me.role,
            avatarUrl: me.avatarUrl,
            publicId: me.publicId,
            phone: me.phone,
            preferredLanguage: me.preferredLanguage,
            emailNotifications: me.emailNotifications,
          })
          void flushProgressQueue(activeToken).catch(() => {})
          void registerPushToken(activeToken).catch(() => {})
        }
      } catch {
        await clearCredentials()
      } finally {
        setLoading(false)
      }
    })()
  }, [clearCredentials, rotateAccessToken])

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY)
    if (!deviceId) {
      deviceId = `amen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId)
    }
    const res = await api.login(email.trim().toLowerCase(), password, {
      deviceId,
      platform: Platform.OS,
      deviceName: Device.modelName || undefined,
    }, totpCode)
    if (!res?.accessToken || !res?.refreshToken || !res?.user) {
      throw new Error("Réponse de connexion invalide")
    }
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, res.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, res.refreshToken),
    ])
    setToken(res.accessToken)
    setUser(res.user)
    // Post-login side effects must never fail the login itself.
    void flushProgressQueue(res.accessToken).catch(() => {})
    void registerPushToken(res.accessToken).catch(() => {})
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      await Promise.allSettled([unregisterPushToken(token), api.logout(token)])
    }
    await clearCredentials()
  }, [token, clearCredentials])

  // Flush any queued progress writes as soon as connectivity returns.
  useEffect(() => {
    if (!token) return
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    ;(async () => {
      try {
        const NetInfo = await import("@react-native-community/netinfo")
        if (cancelled) return
        unsubscribe = NetInfo.default.addEventListener((state) => {
          if (state.isConnected && token) void flushProgressQueue(token).catch(() => {})
        })
      } catch {
        /* NetInfo optional */
      }
    })()
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [token])

  const changeLanguage = useCallback((lang: "fr" | "ar") => {
    setLanguage(lang)
    void AsyncStorage.setItem(LANGUAGE_KEY, lang)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const { user: me } = await api.getProfile(token)
    setUser(me)
    if (me.preferredLanguage === "fr" || me.preferredLanguage === "ar") {
      changeLanguage(me.preferredLanguage)
    }
  }, [token, changeLanguage])

  const updateUser = useCallback((nextUser: MobileUser) => {
    setUser(nextUser)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      language,
      setLanguage: changeLanguage,
      login,
      logout,
      refreshUser,
      updateUser,
    }),
    [user, token, loading, language, changeLanguage, login, logout, refreshUser, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
