"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { PRICING_PLANS } from "@/types"
import { Loader2, CreditCard } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useLanguage } from "@/providers/language-provider"

type Method = { provider: "MANUAL_CASH" | "CLICTOPAY"; available: boolean }
type ContentProduct = { id: string; titleFr: string; titleAr: string; price?: number | null; priceMillis?: number | null; isFree: boolean }

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const plan = searchParams.get("plan") || ""
  const contentId = searchParams.get("content") || ""
  const [provider, setProvider] = useState<"MANUAL_CASH" | "CLICTOPAY">("MANUAL_CASH")
  const [methods, setMethods] = useState<Method[]>([{ provider: "MANUAL_CASH", available: true }])
  const [content, setContent] = useState<ContentProduct | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const idempotencyKey = useRef<string | null>(null)

  useEffect(() => {
    fetch("/api/payments/methods").then((r) => r.json()).then((data) => {
      const available = (data.methods || []).filter((method: Method) => method.available)
      if (available.length) setMethods(available)
    }).catch(() => undefined)
  }, [])
  useEffect(() => {
    if (!contentId) return
    fetch(`/api/content/${encodeURIComponent(contentId)}`).then((r) => r.json()).then(setContent).catch(() => setContent(null))
  }, [contentId])

  const planData = PRICING_PLANS.find((item) => item.id === plan)
  const productKind = contentId ? "CONTENT" : "SUBSCRIPTION"
  const productId = contentId || plan
  const title = contentId ? (isAr ? content?.titleAr : content?.titleFr) : planData?.id.replace(/_/g, " ")
  const amountMillis = contentId
    ? content?.priceMillis ?? Math.round((content?.price || 0) * 1_000)
    : Math.round((planData?.price || 0) * 1_000)
  const validProduct = Boolean(productId && title && amountMillis > 0 && (!contentId || content?.isFree === false))

  const methodLabels = useMemo(() => ({
    MANUAL_CASH: isAr ? "الدفع نقداً — تأكيد الإدارة بعد الاستلام" : "Paiement en espèces — validation après réception",
    CLICTOPAY: isAr ? "الدفع الآمن بالبطاقة عبر ClicToPay" : "Carte bancaire sécurisée via ClicToPay",
  }), [isAr])

  const handleCheckout = async () => {
    if (!termsAccepted) return toast.error(isAr ? "يجب قبول شروط البيع وسياسة الاسترجاع" : "Acceptez les conditions et la politique de remboursement")
    if (!idempotencyKey.current) {
      idempotencyKey.current = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random()}`
    }
    setLoading(true)
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ productKind, productId, provider, termsAccepted: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "PAYMENT_CREATE_FAILED")
      if (provider === "MANUAL_CASH") {
        toast.success(isAr ? "تم تسجيل طلب الدفع النقدي" : "Demande de paiement en espèces enregistrée")
        router.push(contentId ? `/content/${contentId}` : plan.startsWith("TEACHER") ? "/teacher/subscription" : "/student/subscription")
      } else if (data.redirectUrl) {
        window.location.assign(data.redirectUrl)
      } else throw new Error("PAYMENT_REDIRECT_MISSING")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (!validProduct) return <div className="text-center py-16"><p>{isAr ? "المنتج غير متاح للشراء" : "Produit indisponible à l’achat"}</p></div>

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/images/logo.jpeg" alt="Amenallah Edition" className="w-9 h-9 rounded-xl object-cover" />
          <span className="font-bold">Amenallah</span>
        </Link>
        <ModeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{isAr ? "الدفع" : "Paiement"}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 bg-muted rounded-md">
              <p className="font-semibold">{title}</p>
              <p className="text-2xl font-bold mt-1">{(amountMillis / 1_000).toFixed(3)} TND</p>
              {contentId && <p className="text-xs text-muted-foreground mt-1">{isAr ? "وصول دائم لهذا المحتوى" : "Accès permanent à ce contenu"}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{isAr ? "طريقة الدفع" : "Méthode de paiement"}</p>
              {methods.map((method) => (
                <label key={method.provider} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer ${provider === method.provider ? "border-primary bg-primary/5" : ""}`}>
                  <input type="radio" value={method.provider} checked={provider === method.provider} onChange={() => setProvider(method.provider)} className="accent-primary" />
                  <span className="text-sm">{methodLabels[method.provider]}</span>
                </label>
              ))}
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
              <span>{isAr ? "أوافق على" : "J’accepte les"} <Link href="/terms" className="underline">{isAr ? "شروط البيع" : "conditions de vente"}</Link> {isAr ? "و" : "et la"} <Link href="/refund-policy" className="underline">{isAr ? "سياسة الاسترجاع" : "politique de remboursement"}</Link>.</span>
            </label>
            <Button className="w-full" onClick={handleCheckout} disabled={loading || !termsAccepted}>
              {loading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {provider === "MANUAL_CASH" ? (isAr ? "تسجيل الطلب" : "Confirmer la commande") : (isAr ? "الدفع الآمن" : "Procéder au paiement sécurisé")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">{isAr ? "لا يتم إدخال بيانات البطاقة إلا في صفحة الدفع الآمنة التابعة لـ SMT/SPS." : "Les données de carte sont saisies uniquement sur la page sécurisée SMT/SPS."}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}><CheckoutForm /></Suspense>
}
