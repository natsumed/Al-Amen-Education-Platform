"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { PRICING_PLANS } from "@/types"
import { getPlanPrice } from "@/lib/utils"
import { Loader2, CreditCard } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get("plan") || ""
  const [provider, setProvider] = useState("MANUAL")
  const [loading, setLoading] = useState(false)

  const planData = PRICING_PLANS.find(p => p.id === plan)
  const price = getPlanPrice(plan)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "SUBSCRIPTION", plan, provider }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (provider === "MANUAL") {
        toast.success("Demande enregistrée! Un admin activera votre abonnement sous 24h.")
        const role = plan.startsWith("TEACHER") ? "teacher" : "student"
        router.push(`/${role}`)
      } else if (data.paymentSession?.redirectUrl) {
        window.location.href = data.paymentSession.redirectUrl
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (!planData) return <div className="text-center py-16"><p>Plan introuvable</p></div>

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/images/logo.jpeg" alt="Amenallah Edition" className="w-9 h-9 rounded-xl object-cover" />
          <span className="font-bold">Amenallah</span>
        </Link>
        <ModeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Paiement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
            <p className="font-semibold">{plan.replace(/_/g, " ")}</p>
            <p className="text-2xl font-bold mt-1">{price} TND</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Méthode de paiement</p>
            <div className="space-y-2">
              {[
                { value: "MANUAL", label: "Paiement en espèces (activation admin sous 24h)" },
                { value: "KONNECT", label: "Konnect (Bientôt disponible)", disabled: true },
                { value: "FLOUCI", label: "Flouci (Bientôt disponible)", disabled: true },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-3 border rounded-md ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${provider === opt.value ? "border-primary bg-primary/5" : ""}`}>
                  <input type="radio" value={opt.value} checked={provider === opt.value} disabled={opt.disabled} onChange={e => setProvider(e.target.value)} className="accent-primary" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleCheckout} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {provider === "MANUAL" ? "Confirmer la commande" : "Procéder au paiement"}
          </Button>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}><CheckoutForm /></Suspense>
}
