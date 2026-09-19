"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Content = { id: string; displayTitle: string; titleAr: string; titleFr: string; titleEn?: string | null; descriptionAr?: string | null; descriptionFr?: string | null; descriptionEn?: string | null; status: string; isFree: boolean; priceMillis?: number | null; assets: Array<{ id: string; kind: string; status: string; assetRole: string; deliveryProvider?: string | null }> }

export default function EditContentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [content, setContent] = useState<Content | null>(null)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [titleFr, setTitleFr] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [descriptionFr, setDescriptionFr] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")

  useEffect(() => {
    fetch(`/api/admin/content/${params.id}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Contenu introuvable")
      const value = data.content as Content
      setContent(value); setTitle(value.displayTitle || ""); setTitleFr(value.titleFr || ""); setTitleAr(value.titleAr || ""); setTitleEn(value.titleEn || ""); setDescriptionFr(value.descriptionFr || ""); setDescriptionAr(value.descriptionAr || "")
    }).catch((error) => toast.error(error instanceof Error ? error.message : "Erreur"))
  }, [params.id])

  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/content/${params.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayTitle: title, titleFr, titleAr, titleEn: titleEn || null, descriptionFr, descriptionAr }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible")
      toast.success("Métadonnées enregistrées")
      setContent((current) => current ? { ...current, displayTitle: title, titleFr, titleAr, titleEn, descriptionFr, descriptionAr } : current)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erreur") } finally { setSaving(false) }
  }

  const publish = async () => {
    const response = await fetch(`/api/admin/content/${params.id}/publish`, { method: "POST" })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return toast.error(data.error || "Publication impossible")
    toast.success("Contenu publié")
    router.push("/admin/content")
  }

  if (!content) return <div className="p-8 text-muted-foreground">Chargement...</div>
  const primary = content.assets.find((asset) => asset.assetRole === "PRIMARY")
  return <div className="max-w-3xl space-y-6"><div className="flex items-center gap-3"><Link href="/admin/content"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link><div><h1 className="text-2xl font-bold">Réviser le contenu</h1><p className="text-sm text-muted-foreground">Statut: {content.status}</p></div></div><Card><CardHeader><CardTitle>Métadonnées</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Titre principal</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="grid grid-cols-3 gap-3"><div><Label>Français</Label><Input value={titleFr} onChange={(event) => setTitleFr(event.target.value)} /></div><div><Label>Arabe</Label><Input dir="rtl" value={titleAr} onChange={(event) => setTitleAr(event.target.value)} /></div><div><Label>Anglais</Label><Input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} /></div></div><div className="grid grid-cols-2 gap-3"><Textarea value={descriptionFr} onChange={(event) => setDescriptionFr(event.target.value)} placeholder="Description française" /><Textarea dir="rtl" value={descriptionAr} onChange={(event) => setDescriptionAr(event.target.value)} placeholder="الوصف بالعربية" /></div><div className="rounded border p-3 text-sm">Asset primaire: {primary ? `${primary.kind} — ${primary.status}${primary.deliveryProvider ? ` — ${primary.deliveryProvider}` : ""}` : "aucun"}</div><div className="flex gap-3"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer</Button><Button variant="outline" onClick={publish}>Publier si prêt</Button></div></CardContent></Card></div>
}
