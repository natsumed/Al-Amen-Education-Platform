"use client"

import { useEffect, useState } from "react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, DollarSign, Activity, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord Admin</h1>
        <Link href="/admin/content/new"><Button>+ Ajouter contenu</Button></Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Utilisateurs" value={loading ? "..." : stats?.totalUsers ?? 0} icon={Users} description="Total inscrits" />
        <StatsCard title="Contenus" value={loading ? "..." : stats?.totalContent ?? 0} icon={BookOpen} description="Publiés" />
        <StatsCard title="Revenus" value={loading ? "..." : formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} description="Total" />
        <StatsCard title="Abonnements actifs" value={loading ? "..." : stats?.activeSubscriptions ?? 0} icon={Activity} description="Ce mois" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/admin/content"><Button variant="outline" className="h-20 flex-col gap-2"><BookOpen className="h-5 w-5" />Gérer contenus</Button></Link>
            <Link href="/admin/users"><Button variant="outline" className="h-20 flex-col gap-2"><Users className="h-5 w-5" />Utilisateurs</Button></Link>
            <Link href="/admin/manual-activation"><Button variant="outline" className="h-20 flex-col gap-2"><Activity className="h-5 w-5" />Activation manuelle</Button></Link>
            <Link href="/admin/analytics"><Button variant="outline" className="h-20 flex-col gap-2"><TrendingUp className="h-5 w-5" />Analytiques</Button></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contenus récents</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground text-sm">Chargement...</p>
              : stats?.recentContent?.length ? (
                <ul className="space-y-2">
                  {stats.recentContent.slice(0, 5).map((c: any) => (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">{c.titleFr}</span>
                      <span className="text-muted-foreground text-xs">{formatDate(c.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm">Aucun contenu récent</p>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
