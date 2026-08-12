"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

/**
 * Sliding light / dark switch (not a dropdown list).
 */
export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-[3.75rem] shrink-0 items-center rounded-full border border-border",
        "bg-muted p-1 transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-60",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground shadow-sm",
          "transition-transform duration-300 ease-out",
          isDark && "translate-x-[1.65rem]"
        )}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
      </span>
      <span className="sr-only">{isDark ? "Sombre" : "Clair"}</span>
    </button>
  )
}
