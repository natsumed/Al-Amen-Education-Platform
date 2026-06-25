"use client"

import Link from "next/link"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"

  return (
    <div className="min-h-screen flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
            {isAr ? "أ" : "A"}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight">{isAr ? "الأمان" : "Al-Amân"}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{isAr ? "دارالأمان للنشر" : "Éditions Al-Amân"}</span>
          </div>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(isAr ? "fr" : "ar")}
          className="gap-2"
        >
          <Globe className="h-3.5 w-3.5" />
          {isAr ? "Français" : "العربية"}
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      <div className="text-center py-4 text-xs text-muted-foreground">
        © 2024 {isAr ? "دارالأمان للنشر" : "Éditions Al-Amân"}. {isAr ? "جميع الحقوق محفوظة." : "Tous droits réservés."}
      </div>
    </div>
  )
}
