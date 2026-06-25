"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { useTranslation } from "@/lib/translations"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Award, Clock } from "lucide-react"
import { getDaysLeft, formatDate } from "@/lib/utils"

export default function StudentDashboard() {
  const { user } = useCurrentUser()
  const { t } = useTranslation()
  const [subscription, setSubscription] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/subscriptions/me").then((r) => r.json()).then((d) => setSubscription(d.subscription))
    fetch("/api/progress").then((r) => r.json()).then((d) => setProgress(d.items || []))
  }, [])

  const completedCount = progress.filter((p) => p.completed).length
  const totalCount = progress.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bonjour, {user?.name?.split(" ")[0] || "Élève"} 👋</h1>
        <p className="text-muted-foreground">Continuez votre apprentissage</p>
      </div>

      {/* Subscription Status */}
      {subscription ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-primary" />
                <span className="font-semibold">{subscription.plan.replace(/_/g, " ")}</span>
                <Badge variant="success">Actif</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {getDaysLeft(subscription.endDate)} jours restants — expire le {formatDate(subscription.endDate)}
              </p>
            </div>
            <Link href="/student/subscription"><Button size="sm" variant="outline">Gérer</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="font-medium text-amber-800">Abonnez-vous pour accéder à tout le contenu</p><p className="text-sm text-amber-700">À partir de 15 TND/mois</p></div>
            <Link href="/pricing"><Button size="sm">S'abonner</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3"><BookOpen className="h-6 w-6 text-primary" /><span className="font-semibold">Cours accédés</span></div>
            <p className="text-3xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3"><TrendingUp className="h-6 w-6 text-green-600" /><span className="font-semibold">Complétés</span></div>
            <p className="text-3xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3"><Clock className="h-6 w-6 text-amber-500" /><span className="font-semibold">En cours</span></div>
            <p className="text-3xl font-bold">{totalCount - completedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Progress */}
      {progress.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Récemment vus</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {progress.slice(0, 5).map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[250px]">{p.content?.titleFr || "Cours"}</span>
                  <span className="text-muted-foreground">{p.progressPercent}%</span>
                </div>
                <Progress value={p.progressPercent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link href="/student/browse"><Button>Explorer les cours</Button></Link>
        <Link href="/student/progress"><Button variant="outline">Ma progression</Button></Link>
      </div>
    </div>
  )
}
