import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { api, setApiBaseUrlOverride, type MobileUser } from "./api"
import { flushProgressQueue } from "./offline-queue"
import { registerPushToken, unregisterPushToken } from "./notifications"

const TOKEN_KEY = "alamen_mobile_token"
const LANGUAGE_KEY = "alamen_mobile_language"
const API_OVERRIDE_KEY = "alamen_api_base_override"

type AuthContextValue = {
  user: MobileUser | null
  token: string | null
  loading: boolean
  language: "fr" | "ar"
  setLanguage: (lang: "fr" | "ar") => void
  login: (email: string, password: string) => Promise<void>
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

  useEffect(() => {
    ;(async () => {
      try {
        const [stored, savedLanguage, apiOverride] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(LANGUAGE_KEY),
          AsyncStorage.getItem(API_OVERRIDE_KEY),
        ])
        if (apiOverride) setApiBaseUrlOverride(apiOverride)
        if (savedLanguage === "fr" || savedLanguage === "ar") setLanguage(savedLanguage)
        if (stored) {
          const { user: me } = await api.me(stored)
          setToken(stored)
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
          void flushProgressQueue(stored).catch(() => {})
          void registerPushToken(stored).catch(() => {})
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email.trim().toLowerCase(), password)
    if (!res?.token || !res?.user) {
      throw new Error("Réponse de connexion invalide")
    }
    await AsyncStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
    setUser(res.user)
    // Post-login side effects must never fail the login itself.
    void flushProgressQueue(res.token).catch(() => {})
    void registerPushToken(res.token).catch(() => {})
  }, [])

  const logout = useCallback(async () => {
    if (token) void unregisterPushToken(token)
    await AsyncStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [token])

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
