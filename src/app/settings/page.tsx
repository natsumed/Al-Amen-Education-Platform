"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage()
  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-lg space-y-6">
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <Card>
              <CardHeader><CardTitle>Langue / اللغة</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                <Button variant={language === "fr" ? "default" : "outline"} onClick={() => setLanguage("fr")}>Français</Button>
                <Button variant={language === "ar" ? "default" : "outline"} onClick={() => setLanguage("ar")}>العربية</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
