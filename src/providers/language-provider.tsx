"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Language } from "@/types"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  translations: Record<string, any>
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  setLanguage: () => {},
  translations: {},
  isRTL: false,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr")
  const [translations, setTranslations] = useState<Record<string, any>>({})

  const loadTranslations = useCallback(async (lang: Language) => {
    try {
      const data = await fetch(`/locales/${lang}.json`).then((r) => r.json())
      setTranslations(data)
    } catch {
      console.error(`Failed to load translations for ${lang}`)
    }
  }, [])

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("language")) as Language | null
    const initial: Language = saved === "ar" || saved === "fr" ? saved : "fr"
    setLanguageState(initial)
    loadTranslations(initial)
  }, [loadTranslations])

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = language
    document.documentElement.setAttribute(
      "class",
      language === "ar" ? "font-arabic" : ""
    )
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
    loadTranslations(lang)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translations,
        isRTL: language === "ar",
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
