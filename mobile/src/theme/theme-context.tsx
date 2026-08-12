import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { darkColors, lightColors, type ThemeColors } from "./palettes"

const THEME_KEY = "alamen_color_scheme"

export type ColorSchemePreference = "light" | "dark"

type ThemeContextValue = {
  /** Resolved palette currently applied */
  colors: ThemeColors
  /** User preference (light or dark) */
  scheme: ColorSchemePreference
  isDark: boolean
  setScheme: (scheme: ColorSchemePreference) => void
  toggleScheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme()
  const [scheme, setSchemeState] = useState<ColorSchemePreference>("light")

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") {
        setSchemeState(stored)
      } else {
        setSchemeState(system === "dark" ? "dark" : "light")
      }
    })
  }, [system])

  const setScheme = useCallback((next: ColorSchemePreference) => {
    setSchemeState(next)
    void AsyncStorage.setItem(THEME_KEY, next)
  }, [])

  const toggleScheme = useCallback(() => {
    setScheme(scheme === "dark" ? "light" : "dark")
  }, [scheme, setScheme])

  const isDark = scheme === "dark"
  const colors = isDark ? darkColors : lightColors

  const value = useMemo(
    () => ({ colors, scheme, isDark, setScheme, toggleScheme }),
    [colors, scheme, isDark, setScheme, toggleScheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider")
  return ctx
}

/** Prefer this over the static `colors` export when UI must react to theme. */
export function useColors(): ThemeColors {
  return useAppTheme().colors
}
