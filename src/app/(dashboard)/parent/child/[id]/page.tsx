"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ChildDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    fetch(`/api/users/${id}`).then(r=>r.json()).then(setData)
  }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/parent/children"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">{data?.fullName || "Enfant"}</h1>
      </div>
      {data?.progress?.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Progression</h2>
          {data.progress.map((p: any) => (
            <Card key={p.id}><CardContent className="p-4">
              <p className="font-medium mb-2">{p.content?.titleFr}</p>
              <div className="flex items-center gap-2">
                <Progress value={p.progressPercent} className="flex-1 h-2" />
                <span className="text-sm">{p.progressPercent}%</span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
