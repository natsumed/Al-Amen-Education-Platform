"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContentFilters } from "@/components/content/content-filters"
import { formatDate, contentTypeLabel, gradeLabel } from "@/lib/utils"
import { Pencil, Trash2, Plus, Sparkles, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function AdminContentPage() {
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [jobs, setJobs] = useState<any[]>([])
  const [sourceRef, setSourceRef] = useState("")
  const [instructions, setInstructions] = useState("")
  const [submittingAi, setSubmittingAi] = useState(false)

  const fetchJobs = async () => {
    const res = await fetch("/api/admin/content/ingestions", { cache: "no-store" })
    if (res.ok) setJobs((await res.json()).jobs || [])
  }

  const fetchContent = async (f: Record<string, string> = {}) => {
    setLoading(true)
    const q = new URLSearchParams(f).toString()
    const res = await fetch(`/api/content?${q}&limit=50`)
    const data = await res.json()
    setContents(data.items || [])
    setLoading(false)
  }

  useEffect(() => { fetchContent(filters as any) }, [filters])
  useEffect(() => { void fetchJobs() }, [])

  const createAiDraft = async () => {
    if (!sourceRef.trim()) return
    setSubmittingAi(true)
    try {
      const res = await fetch("/api/admin/content/ingestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: sourceRef.includes("/folders/") ? "DRIVE_FOLDER" : "DRIVE_FILE",
          sourceRef,
          instructions,
        }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 202) throw new Error(data.error || "Erreur AI")
      toast.success(res.status === 202 ? "Tâche créée — configuration AI requise" : "Proposition AI prête à valider")
      setSourceRef("")
      setInstructions("")
      await fetchJobs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur AI")
    } finally {
      setSubmittingAi(false)
    }
  }

  const approveJob = async (id: string) => {
    const res = await fetch(`/api/admin/content/ingestions/${id}/approve`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error || "Approbation impossible")
    toast.success("Brouillon approuvé et placé dans la file de traitement sécurisé")
    await Promise.all([fetchJobs(), fetchContent(filters as any)])
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce contenu?")) return
    const res = await fetch(`/api/content/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Supprimé!"); fetchContent(filters as any) }
    else toast.error("Erreur lors de la suppression")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des contenus</h1>
        <Link href="/admin/content/new"><Button><Plus className="h-4 w-4 mr-2" />Ajouter</Button></Link>
      </div>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Assistant d&apos;ingestion sécurisé</CardTitle>
          <CardDescription>
            Ajoutez un lien Drive privé. L&apos;AI prépare un brouillon bilingue; rien n&apos;est publié sans votre validation et sans traitement DRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-source">Lien Google Drive privé</Label>
            <Input id="ai-source" value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="https://drive.google.com/file/d/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-instructions">Instructions facultatives</Label>
            <Textarea id="ai-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Niveau, matière ou contexte utile..." maxLength={2000} />
          </div>
          <Button onClick={createAiDraft} disabled={submittingAi || !sourceRef.trim()}>
            <Sparkles className="h-4 w-4 mr-2" />{submittingAi ? "Analyse..." : "Créer la proposition"}
          </Button>
          {jobs.length > 0 && (
            <div className="space-y-2 pt-2">
              {jobs.slice(0, 8).map((job) => (
                <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="font-medium">{job.proposal?.titleFr || job.sourceType}</span>
                      <Badge variant="secondary">{job.status}</Badge>
                    </div>
                    {typeof job.confidence === "number" && <p className="text-xs text-muted-foreground mt-1">Confiance: {Math.round(job.confidence * 100)}%</p>}
                  </div>
                  {job.status === "REVIEW_REQUIRED" && (
                    <Button size="sm" onClick={() => approveJob(job.id)}>Approuver le brouillon</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ContentFilters onFiltersChange={setFilters} />
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Année</TableHead>
              <TableHead>Accès</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chargement...</TableCell></TableRow>
            ) : contents.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium max-w-[200px] truncate">{c.titleFr}</TableCell>
                <TableCell>{contentTypeLabel(c.contentType)}</TableCell>
                <TableCell>{gradeLabel(c.grade)}</TableCell>
                <TableCell><Badge variant={c.isFree ? "success" : "warning"}>{c.isFree ? "Gratuit" : "Premium"}</Badge></TableCell>
                <TableCell><Badge variant={c.status === "PUBLISHED" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/content/${c.id}/edit`}><Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button></Link>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
