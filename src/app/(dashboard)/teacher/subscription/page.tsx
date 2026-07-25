"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, CreditCard } from "lucide-react"
import { SubscriptionPeriod } from "@/components/subscription/subscription-period"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeacherSubscriptionPage() {
  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/subscriptions/me")
      .then((r) => r.json())
      .then((d) => {
        setSub(d.subscription)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-lg space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Mon abonnement</h1>
      {sub ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{sub.plan.replace(/_/g, " ")}</p>
                <Badge variant="success" className="mt-1">Actif</Badge>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <SubscriptionPeriod startDate={sub.startDate} endDate={sub.endDate} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Aucun abonnement actif.</p>
            <Link href="/pricing">
              <Button>Voir les tarifs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
