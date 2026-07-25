"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Baby, CreditCard, Shield } from "lucide-react"

export default function ParentDashboard() {
  const { user } = useCurrentUser()
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-amber-50 border border-primary/10 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Bonjour, {user?.name?.split(" ")[0] || "Parent"}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl">
              Espace parent : suivez la progression de vos enfants et payez leur abonnement.
              Vous n&apos;avez pas accès aux cours — c&apos;est réservé aux élèves et enseignants.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm ring-1 ring-border/60 hover:ring-primary/30 transition-all">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Baby className="h-5 w-5 text-amber-700" />
              </div>
              <h3 className="font-semibold text-lg">Mes enfants</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Invitez un élève existant, attendez son acceptation, puis consultez sa progression.
            </p>
            <Link href="/parent/children">
              <Button>Gérer mes enfants</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/60 hover:ring-primary/30 transition-all">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Payer pour un enfant</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Demande d&apos;abonnement élève — l&apos;admin confirme après réception du paiement.
            </p>
            <Link href="/parent/pay">
              <Button variant="outline">Nouvelle demande</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
