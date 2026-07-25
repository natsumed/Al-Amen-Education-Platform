"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#059669", "#d97706"]

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setStats)
  }, [])

  const contentByType = stats?.contentByType ? Object.entries(stats.contentByType).map(([name, value]) => ({ name, value })) : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytiques</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Contenus par type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={contentByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {contentByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Résumé</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Utilisateurs totaux", value: stats?.totalUsers },
              { label: "Contenus publiés", value: stats?.totalContent },
              { label: "Abonnements actifs", value: stats?.activeSubscriptions },
              { label: "Nouveaux ce mois", value: stats?.newUsersThisMonth },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="font-bold text-lg">{s.value ?? "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
