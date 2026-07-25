"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContentFilters } from "@/components/content/content-filters"
import { formatDate, contentTypeLabel, gradeLabel } from "@/lib/utils"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

export default function AdminContentPage() {
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})

  const fetchContent = async (f: Record<string, string> = {}) => {
    setLoading(true)
    const q = new URLSearchParams(f).toString()
    const res = await fetch(`/api/content?${q}&limit=50`)
    const data = await res.json()
    setContents(data.items || [])
    setLoading(false)
  }

  useEffect(() => { fetchContent(filters as any) }, [filters])

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
