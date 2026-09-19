"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContentFilters } from "@/components/content/content-filters"
import { formatDate, contentTypeLabel, gradeLabel } from "@/lib/utils"
import { Pencil, Trash2, Plus, Sparkles, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export default function AdminContentPage() {
  const router = useRouter()
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [jobs, setJobs] = useState<any[]>([])
  const [intakes, setIntakes] = useState<any[]>([])
  const [configStatus, setConfigStatus] = useState<{ ready: boolean; checks: Record<string, boolean> } | null>(null)

  const fetchJobs = async () => {
    const res = await fetch("/api/admin/content/ingestions", { cache: "no-store" })
    if (res.ok) setJobs((await res.json()).jobs || [])
  }

  const fetchIntakes = async () => {
    const res = await fetch("/api/admin/content/intakes", { cache: "no-store" })
    if (res.ok) setIntakes((await res.json()).intakes || [])
  }

  const fetchContent = async (f: Record<string, string> = {}) => {
    setLoading(true)
    const q = new URLSearchParams(f).toString()
    const res = await fetch(`/api/admin/content?${q}&limit=50`, { cache: "no-store" })
    const data = await res.json()
    setContents(data.items || [])
    setLoading(false)
  }

  useEffect(() => { fetchContent(filters as any) }, [filters])
  useEffect(() => { void fetchJobs(); void fetchIntakes() }, [])
  useEffect(() => { fetch("/api/admin/content/config-status", { cache: "no-store" }).then((res) => res.ok ? res.json() : null).then((data) => { if (data) setConfigStatus(data) }).catch(() => undefined) }, [])

  const createAiDraft = () => { router.push("/admin/content/new") }

  const intakeAction = async (id: string, action: "approve" | "retry" | "reject") => {
    const reason = action === "reject" ? window.prompt("Motif du rejet (obligatoire)") : null
    if (action === "reject" && !reason?.trim()) return
    const res = await fetch(`/api/admin/content/intakes/${id}/${action}`, {
      method: "POST",
      headers: action === "reject" ? { "Content-Type": "application/json" } : undefined,
      body: action === "reject" ? JSON.stringify({ reason }) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error(data.error || "Action impossible")
    toast.success(action === "approve" ? "Brouillon sécurisé créé" : action === "retry" ? "Intake remis en traitement" : "Intake rejeté")
    await fetchIntakes()
  }

  const approveJob = async (id: string) => {
    const res = await fetch(`/api/admin/content/ingestions/${id}/approve`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error || "Approbation impossible")
    toast.success("Brouillon approuvé et placé dans la file de traitement sécurisé")
    await Promise.all([fetchJobs(), fetchIntakes(), fetchContent(filters as any)])
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
            Sélectionnez un fichier ou un dossier depuis Drive privé 01_Masters. L&apos;IA prépare les métadonnées en arabe, français et anglais; rien n&apos;est publié sans validation humaine et traitement sécurisé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configStatus && !configStatus.ready && <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Configuration incomplète: Drive, OpenAI, scanner, outils PDF, stockage privé et worker doivent être prêts avant le traitement final.</div>}
          <Button onClick={createAiDraft}>
            <Sparkles className="h-4 w-4 mr-2" />Importer ou créer un brouillon
          </Button>
          {intakes.length > 0 && (
            <div className="space-y-2 pt-2">
              {intakes.slice(0, 12).map((intake) => (
                <div key={intake.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><span className="font-medium">{intake.sourceFileName}</span><Badge variant="secondary">{intake.status}</Badge></div>
                    <p className="text-xs text-muted-foreground mt-1">{intake.titleAr || intake.titleFr || intake.titleEn || "Métadonnées à compléter"} · {intake.category || "REVIEW_REQUIRED"} · {intake.language || "MULTI"} · {intake.audience || "INTERNAL"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(intake.status === "REVIEW_REQUIRED") && <Button size="sm" onClick={() => intakeAction(intake.id, "approve")}>Approuver</Button>}
                    {(intake.status === "FAILED" || intake.status === "WAITING_FOR_SCAN") && <Button size="sm" variant="outline" onClick={() => intakeAction(intake.id, "retry")}>Réessayer</Button>}
                    {(intake.status === "REVIEW_REQUIRED" || intake.status === "DUPLICATE_REVIEW") && <Button size="sm" variant="ghost" onClick={() => intakeAction(intake.id, "reject")}>Rejeter</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <TableCell className="font-medium max-w-[200px] truncate">{c.displayTitle || c.titleFr || c.titleAr || c.titleEn || "Sans titre"}</TableCell>
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
