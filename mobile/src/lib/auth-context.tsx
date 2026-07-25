import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { api, type MobileUser } from "./api"

const TOKEN_KEY = "alamen_mobile_token"

type AuthContextValue = {
  user: MobileUser | null
  token: string | null
  loading: boolean
  language: "fr" | "ar"
  setLanguage: (lang: "fr" | "ar") => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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
        const stored = await AsyncStorage.getItem(TOKEN_KEY)
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
          })
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    await AsyncStorage.setItem(TOKEN_KEY, res.token)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, language, setLanguage, login, logout }),
    [user, token, loading, language, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
