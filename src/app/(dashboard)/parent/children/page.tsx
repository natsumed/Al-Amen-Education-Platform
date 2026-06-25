"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
export default function ParentChildrenPage() {
  const [links, setLinks] = useState<any[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch("/api/parents/children").then(r=>r.json()).then(d=>setLinks(d.links||[])) }, [])
  const addChild = async () => {
    if (!email) return
    setLoading(true)
    const res = await fetch("/api/parents/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ childEmail: email }) })
    if (res.ok) { toast.success("Invitation envoyée!"); setEmail("") }
    else toast.error("Erreur")
    setLoading(false)
  }
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Mes enfants</h1>
      <Card><CardContent className="p-6 space-y-3">
        <h3 className="font-semibold">Ajouter un enfant</h3>
        <div className="flex gap-2">
          <Input placeholder="Email de l'enfant" value={email} onChange={e=>setEmail(e.target.value)} />
          <Button onClick={addChild} disabled={loading}><UserPlus className="h-4 w-4 mr-2" />Ajouter</Button>
        </div>
      </CardContent></Card>
      {links.length > 0 && (
        <div className="space-y-3">
          {links.map((l:any) => (
            <Card key={l.id}><CardContent className="p-4 flex justify-between items-center">
              <div><p className="font-medium">{l.student?.fullName}</p><p className="text-sm text-muted-foreground">{l.student?.email}</p></div>
              <span className={`text-xs px-2 py-1 rounded-full ${l.status==="ACCEPTED"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}`}>{l.status}</span>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
