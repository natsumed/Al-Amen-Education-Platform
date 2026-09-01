"use client"

import { useEffect, type ReactNode } from "react"

type ContentProtectionProps = {
  enabled: boolean
  children: ReactNode
}

/** Deters casual copying and printing; it cannot prevent screenshots or developer tools. */
export function ContentProtection({ enabled, children }: ContentProtectionProps) {
  useEffect(() => {
    if (!enabled) return

    const prevent = (event: Event) => event.preventDefault()
    const preventShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && ["c", "p", "s", "u"].includes(key)) {
        event.preventDefault()
      }
    }

    document.addEventListener("contextmenu", prevent)
    document.addEventListener("copy", prevent)
    document.addEventListener("cut", prevent)
    document.addEventListener("dragstart", prevent)
    document.addEventListener("keydown", preventShortcuts)

    return () => {
      document.removeEventListener("contextmenu", prevent)
      document.removeEventListener("copy", prevent)
      document.removeEventListener("cut", prevent)
      document.removeEventListener("dragstart", prevent)
      document.removeEventListener("keydown", preventShortcuts)
    }
  }, [enabled])

  return <div className={enabled ? "select-none" : undefined}>{children}</div>
}
