"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, getDaysLeft, formatCurrency } from "@/lib/utils"
import { CheckCircle, Clock, CreditCard } from "lucide-react"

export default function StudentSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/subscriptions/me").then((r) => r.json()).then((d) => { setSubscription(d.subscription); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center py-16 text-muted-foreground">Chargement...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Mon abonnement</h1>
      {subscription ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{subscription.plan.replace(/_/g, " ")}</p>
                <Badge variant="success" className="mt-1">Actif</Badge>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Date de début</p><p className="font-medium">{formatDate(subscription.startDate)}</p></div>
              <div><p className="text-muted-foreground">Date d'expiration</p><p className="font-medium">{formatDate(subscription.endDate)}</p></div>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <p className="text-sm"><strong>{getDaysLeft(subscription.endDate)} jours</strong> restants</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">Aucun abonnement actif</h3>
            <p className="text-muted-foreground text-sm">Abonnez-vous pour accéder à tous les cours, livres et animations.</p>
            <Link href="/pricing"><Button className="w-full">Voir les tarifs</Button></Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
