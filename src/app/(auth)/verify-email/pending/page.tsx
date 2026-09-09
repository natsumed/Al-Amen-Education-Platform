"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MailCheck, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"

const RESEND_COOLDOWN_SECONDS = 60

export default function VerificationPendingPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch("/api/auth/verify-email/pending").then((response) => response.json()).then((data: { maskedEmail?: string }) => setMaskedEmail(data.maskedEmail || null)).catch(() => undefined)
  }, [])
  useEffect(() => {
    if (!cooldown) return
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const resend = async () => {
    setBusy(true); setMessage("")
    try {
      await fetch("/api/auth/verify-email/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setMessage(isAr ? "إذا كان الحساب يحتاج التأكيد، أرسلنا رابطاً جديداً." : "Si le compte nécessite une confirmation, un nouveau lien a été envoyé.")
    } catch {
      setMessage(isAr ? "تعذر إرسال الرابط الآن." : "Impossible d'envoyer le lien pour le moment.")
    } finally { setBusy(false) }
  }

  return <Card className="border-0 shadow-2xl shadow-primary/5" dir={isAr ? "rtl" : "ltr"}>
    <CardHeader className="text-center"><MailCheck className="mx-auto h-10 w-10 text-primary" /><CardTitle>{isAr ? "أكد بريدك الإلكتروني لتفعيل الحساب" : "Confirmez votre email pour activer votre compte"}</CardTitle></CardHeader>
    <CardContent className="space-y-5 text-center">
      <p className="text-sm text-muted-foreground">{isAr ? "أنشأنا حسابك. افتح رسالة التأكيد التي أرسلناها إلى" : "Votre compte a été créé. Ouvrez le message de confirmation envoyé à"}{maskedEmail ? <span className="mt-1 block font-medium text-foreground">{maskedEmail}</span> : null}</p>
      <p className="text-xs text-muted-foreground">{isAr ? "لن تتمكن من تسجيل الدخول قبل تأكيد البريد الإلكتروني." : "La connexion sera disponible après la confirmation de l'adresse email."}</p>
      <Button className="w-full" variant="outline" disabled={busy || cooldown > 0} onClick={() => void resend()}><RefreshCw className="mr-2 h-4 w-4" />{cooldown > 0 ? `${isAr ? "إعادة الإرسال بعد" : "Renvoyer dans"} ${cooldown}s` : (isAr ? "إعادة إرسال البريد" : "Renvoyer l'email")}</Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <Button asChild variant="ghost" className="w-full"><Link href="/login">{isAr ? "العودة إلى تسجيل الدخول" : "Retour à la connexion"}</Link></Button>
    </CardContent>
  </Card>
}
