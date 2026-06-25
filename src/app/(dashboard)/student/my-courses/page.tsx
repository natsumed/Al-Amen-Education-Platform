"use client"

import { useEffect, useState } from "react"
import { ContentCard } from "@/components/content/content-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyCoursesPage() {
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/progress").then(r=>r.json()).then(d=>{ setProgress(d.items||[]); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes cours</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_,i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes cours ({progress.length})</h1>
      {progress.length === 0 ? (
        <p className="text-muted-foreground">Vous n'avez pas encore commencé de cours.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {progress.map((p) => p.content && <ContentCard key={p.id} content={p.content} canAccess={true} />)}
        </div>
      )}
    </div>
  )
}
