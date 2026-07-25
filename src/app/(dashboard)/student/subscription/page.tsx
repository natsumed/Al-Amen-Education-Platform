"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle } from "lucide-react"
import { SubscriptionPeriod } from "@/components/subscription/subscription-period"
import { Skeleton } from "@/components/ui/skeleton"

export default function StudentSubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/subscriptions/me")
      .then((r) => r.json())
      .then((d) => {
        setSubscription(d.subscription)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

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
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <SubscriptionPeriod
              startDate={subscription.startDate}
              endDate={subscription.endDate}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">Aucun abonnement actif</h3>
            <p className="text-muted-foreground text-sm">
              Abonnez-vous pour accéder à tous les cours, livres et animations.
            </p>
            <Link href="/pricing">
              <Button className="w-full">Voir les tarifs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
