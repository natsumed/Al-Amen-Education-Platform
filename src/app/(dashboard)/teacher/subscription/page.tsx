"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, getDaysLeft } from "@/lib/utils"
export default function TeacherSubscriptionPage() {
  const [sub, setSub] = useState<any>(null)
  useEffect(() => { fetch("/api/subscriptions/me").then(r=>r.json()).then(d=>setSub(d.subscription)) }, [])
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Mon abonnement</h1>
      {sub ? (
        <Card><CardContent className="p-6 space-y-3">
          <p className="font-semibold">{sub.plan.replace(/_/g," ")}</p>
          <p className="text-sm text-muted-foreground">Expire le {formatDate(sub.endDate)} ({getDaysLeft(sub.endDate)} jours)</p>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-6 text-center space-y-4"><p className="text-muted-foreground">Aucun abonnement actif.</p><Link href="/pricing"><Button>Voir les tarifs</Button></Link></CardContent></Card>
      )}
    </div>
  )
}
