"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileAppBanner() {
  const [mobile, setMobile] = useState(false)
  const [closed, setClosed] = useState(false)
  useEffect(() => {
    setMobile(/android|iphone|ipad|ipod/i.test(navigator.userAgent))
  }, [])
  if (!mobile || closed) return null
  return (
    <aside className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur-md" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }} aria-label="Amenallah mobile app">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Smartphone className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Amenallah</p><p className="text-xs text-muted-foreground">Ouvrez l’application sécurisée pour les leçons.</p></div>
        <Button asChild size="sm" className="shrink-0"><Link href="/app">Ouvrir</Link></Button>
        <button type="button" className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Fermer" onClick={() => setClosed(true)}><X className="h-4 w-4" /></button>
      </div>
    </aside>
  )
}
