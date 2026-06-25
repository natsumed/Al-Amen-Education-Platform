"use client"

import { useCallback } from "react"
import { useLanguage } from "@/providers/language-provider"
import type { Language } from "@/types"

// Flat-key accessor with dot notation e.g. "auth.login"
export function getTranslation(
  translations: Record<string, any>,
  key: string
): string {
  const keys = key.split(".")
  let current: any = translations
  for (const k of keys) {
    if (current == null || typeof current !== "object") return key
    current = current[k]
  }
  return typeof current === "string" ? current : key
}

export function useTranslation() {
  const { language, translations } = useLanguage()

  const t = useCallback(
    (key: string): string => {
      return getTranslation(translations, key)
    },
    [translations]
  )

  return { t, language }
}

// Static translation loader for server components
export async function loadTranslations(lang: Language): Promise<Record<string, any>> {
  try {
    const data = await import(`../../public/locales/${lang}.json`)
    return data.default
  } catch {
    return {}
  }
}
