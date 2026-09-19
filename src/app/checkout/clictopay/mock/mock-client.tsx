"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

function MockPayment() {
  const params = useSearchParams()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const paymentId = params.get("paymentId")

  const approve = async () => {
    if (!paymentId) return
    setBusy(true)
    setError("")
    const response = await fetch("/api/payments/clictopay/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || "Mock payment failed")
      setBusy(false)
      return
    }
    router.replace(`/checkout/clictopay/success?paymentId=${encodeURIComponent(paymentId)}`)
  }

  return <main className="container max-w-lg space-y-5 py-20 text-center">
    <h1 className="text-2xl font-bold">Simulateur ClicToPay local</h1>
    <p className="text-muted-foreground">Cette page n’existe jamais en production.</p>
    {error ? <p className="text-destructive">{error}</p> : null}
    <Button disabled={!paymentId || busy} onClick={() => void approve()}>
      {busy ? "Vérification…" : "Simuler un paiement vérifié"}
    </Button>
  </main>
}

export function MockClicToPayClient() {
  return <Suspense fallback={<main className="py-20 text-center">Chargement…</main>}><MockPayment /></Suspense>
}
