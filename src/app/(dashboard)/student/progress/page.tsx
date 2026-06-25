"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function StudentProgressPage() {
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/progress").then(r=>r.json()).then(d=>{ setProgress(d.items||[]); setLoading(false) })
  }, [])

  const completed = progress.filter(p=>p.completed)
  const inProgress = progress.filter(p=>!p.completed)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ma progression</h1>
      <div className="grid grid-cols-3 gap-4 text-center">
        <Card><CardContent className="p-4"><p className="text-3xl font-bold">{progress.length}</p><p className="text-muted-foreground text-sm">Total</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-green-600">{completed.length}</p><p className="text-muted-foreground text-sm">Complétés</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-3xl font-bold text-amber-500">{inProgress.length}</p><p className="text-muted-foreground text-sm">En cours</p></CardContent></Card>
      </div>
      {loading ? <p className="text-muted-foreground">Chargement...</p> : (
        <div className="space-y-3">
          {progress.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {p.completed ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> : <Clock className="h-5 w-5 text-amber-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.content?.titleFr || "Cours"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={p.progressPercent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">{p.progressPercent}%</span>
                  </div>
                </div>
                <Badge variant={p.completed ? "success" : "secondary"} className="shrink-0">
                  {p.completed ? "Terminé" : "En cours"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
