"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

function Status() {
  const params = useSearchParams()
  const paymentId = params.get("paymentId")
  const [status, setStatus] = useState("PROCESSING")
  useEffect(() => {
    if (!paymentId) return
    let stopped = false
    let attempts = 0
    const poll = async () => {
      attempts += 1
      const response = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`, { cache: "no-store" }).catch(() => null)
      const data = response ? await response.json().catch(() => ({})) : {}
      if (!stopped && typeof data.status === "string") setStatus(data.status)
      if (!stopped && !["SUCCEEDED", "DECLINED", "CANCELLED", "EXPIRED", "REFUNDED"].includes(data.status) && attempts < 30) {
        setTimeout(poll, 2_000)
      }
    }
    void poll()
    return () => { stopped = true }
  }, [paymentId])

  const successful = status === "SUCCEEDED"
  return <main className="container max-w-xl py-20 text-center space-y-5">
    {!successful && <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />}
    <h1 className="text-2xl font-bold">{successful ? "Paiement confirmé" : "Paiement reçu pour vérification"}</h1>
    <p className="text-muted-foreground">{successful ? "Votre accès est maintenant actif." : "La page de retour n’active aucun accès. Nous attendons la confirmation sécurisée du serveur SMT."}</p>
    <p className="text-sm">Statut: <strong>{status}</strong></p>
    {paymentId && successful && <a href={`/api/payments/${paymentId}/receipt`}><Button variant="outline">Télécharger le reçu</Button></a>}
    <div><Link href="/student"><Button>Retour à mon espace</Button></Link></div>
  </main>
}

export default function ClicToPaySuccessPage() {
  return <Suspense fallback={<main className="py-20 text-center"><Loader2 className="h-8 w-8 mx-auto animate-spin" /></main>}><Status /></Suspense>
}
