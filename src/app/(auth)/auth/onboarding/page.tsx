"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/providers/language-provider"

type Role = "STUDENT" | "PARENT" | "TEACHER"
const destination: Record<Role, string> = { STUDENT: "/student", PARENT: "/parent", TEACHER: "/teacher" }

export default function SocialOnboardingPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const router = useRouter()
  const { update } = useSession()
  const [role, setRole] = useState<Role>("STUDENT")
  const [phone, setPhone] = useState("")
  const [studentPublicId, setStudentPublicId] = useState("")
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaCode, setMfaCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => { fetch("/api/auth/onboarding").then((r) => r.json()).then((data) => { setPhone(data.user?.phone || ""); setMfaEnabled(Boolean(data.mfaEnabled)) }).catch(() => setError(isAr ? "تعذر تحميل التسجيل" : "Impossible de charger l'inscription")) }, [isAr])

  const beginMfa = async () => {
    setBusy(true); setError("")
    try {
      const response = await fetch("/api/security/mfa", { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "MFA unavailable")
      setMfaSecret(data.secret || "")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "MFA unavailable") } finally { setBusy(false) }
  }
  const confirmMfa = async () => {
    setBusy(true); setError("")
    try {
      const response = await fetch("/api/security/mfa", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: mfaCode }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Code invalide")
      setMfaEnabled(true); setMfaSecret("")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Code invalide") } finally { setBusy(false) }
  }
  const submit = async () => {
    if (role === "TEACHER" && !mfaEnabled) { setError(isAr ? "فعّل المصادقة الثنائية أولاً." : "Activez d'abord la double authentification."); return }
    setBusy(true); setError("")
    try {
      const response = await fetch("/api/auth/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, preferredLanguage: language, phone, studentPublicId: role === "PARENT" && studentPublicId ? studentPublicId : undefined }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Impossible de terminer l'inscription")
      await update({ refreshClaims: true } as never)
      router.replace(destination[role]); router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de terminer l'inscription") } finally { setBusy(false) }
  }

  return <Card className="border-0 shadow-2xl shadow-primary/5" dir={isAr ? "rtl" : "ltr"}>
    <CardHeader><CardTitle>{isAr ? "أكمل حسابك" : "Complétez votre compte"}</CardTitle><CardDescription>{isAr ? "اختر نوع الحساب لإتاحة المساحة المناسبة." : "Choisissez votre profil pour activer votre espace."}</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2"><Label>{isAr ? "نوع الحساب" : "Profil"}</Label><Select value={role} onValueChange={(value) => setRole(value as Role)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STUDENT">{isAr ? "تلميذ" : "Élève"}</SelectItem><SelectItem value="PARENT">{isAr ? "ولي" : "Parent"}</SelectItem><SelectItem value="TEACHER">{isAr ? "معلّم" : "Enseignant"}</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label>{isAr ? "رقم الهاتف (اختياري)" : "Téléphone (facultatif)"}</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" /></div>
      {role === "PARENT" ? <div className="space-y-2"><Label>{isAr ? "رقم حساب التلميذ (اختياري)" : "N° compte élève (facultatif)"}</Label><Input value={studentPublicId} onChange={(event) => setStudentPublicId(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" /><p className="text-xs text-muted-foreground">{isAr ? "سنرسل طلب ربط للتلميذ." : "Une demande de liaison sera envoyée à l'élève."}</p></div> : null}
      {role === "TEACHER" ? <div className="space-y-3 rounded-lg border p-4"><p className="text-sm font-medium">{isAr ? "المصادقة الثنائية مطلوبة للمعلمين" : "La double authentification est requise pour les enseignants"}</p>{!mfaEnabled && !mfaSecret ? <Button type="button" variant="outline" onClick={() => void beginMfa()} disabled={busy}>{isAr ? "إعداد تطبيق المصادقة" : "Configurer l'application d'authentification"}</Button> : null}{mfaSecret ? <><p className="text-xs text-muted-foreground">{isAr ? "أضف هذا المفتاح يدوياً في تطبيق المصادقة ثم أدخل الرمز:" : "Ajoutez cette clé dans votre application d'authentification, puis saisissez le code :"}</p><code className="block break-all rounded bg-muted p-2 text-xs">{mfaSecret}</code><Input value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} inputMode="numeric" placeholder="123456" maxLength={12} /><Button type="button" variant="outline" onClick={() => void confirmMfa()} disabled={busy}>{isAr ? "تأكيد الرمز" : "Confirmer le code"}</Button></> : null}{mfaEnabled ? <p className="text-sm text-emerald-700">{isAr ? "تم تفعيل المصادقة الثنائية." : "Double authentification activée."}</p> : null}</div> : null}
      <Button className="w-full" onClick={() => void submit()} disabled={busy}>{isAr ? "تفعيل الحساب" : "Activer mon compte"}</Button>
    </CardContent>
  </Card>
}
