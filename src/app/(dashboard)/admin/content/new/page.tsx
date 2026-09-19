"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, FileUp, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createContentSchema, type CreateContentInput } from "@/lib/validations"

type DriveEntry = { id: string; name: string; relativePath: string; mimeType: string; kind: "FILE" | "FOLDER" }

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveEntries, setDriveEntries] = useState<DriveEntry[]>([])
  const [sourceId, setSourceId] = useState("")
  const [isFree, setIsFree] = useState(true)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateContentInput>({
    resolver: zodResolver(createContentSchema),
    defaultValues: { isFree: true, status: "DRAFT", audience: "LEARNER", primaryLanguage: "MULTI" },
  })

  useEffect(() => {
    setDriveLoading(true)
    fetch("/api/admin/content/drive", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return
        const data = await response.json()
        setDriveEntries(data.entries || [])
      })
      .catch(() => undefined)
      .finally(() => setDriveLoading(false))
  }, [])

  const onSubmit = async (data: CreateContentInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, isFree, status: "DRAFT" }) })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.error || "Erreur")
      toast.success("Brouillon créé. Ajoutez maintenant un asset sécurisé ou importez-le depuis Drive.")
      router.push("/admin/content")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur")
    } finally { setLoading(false) }
  }

  const importFromDrive = async () => {
    if (!sourceId) return toast.error("Sélectionnez un fichier ou un dossier Drive privé")
    const entry = driveEntries.find((item) => item.id === sourceId)
    if (!entry) return toast.error("La source Drive n'est plus disponible")
    setLoading(true)
    try {
      const res = await fetch("/api/admin/content/intakes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceType: entry.kind === "FOLDER" ? "DRIVE_FOLDER" : "DRIVE_FILE", sourceId: entry.id }) })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.error || "Import Drive impossible")
      toast.success(`${result.created || 0} élément(s) placé(s) dans la file d'analyse sécurisée.`)
      router.push("/admin/content")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import Drive impossible")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3"><Link href="/admin/content"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link><div><h1 className="text-2xl font-bold">Ajouter un contenu</h1><p className="text-sm text-muted-foreground">Tout nouveau contenu est enregistré comme brouillon.</p></div></div>

      <Card className="border-primary/20">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Importer depuis Drive privé</CardTitle><CardDescription>Le serveur vérifie que la source appartient au dossier 01_Masters, puis l'analyse et prépare un brouillon. Aucun lien Drive ou PDF ne sera exposé aux utilisateurs.</CardDescription></CardHeader>
        <CardContent className="space-y-3"><Label htmlFor="drive-source">Fichier ou dossier source</Label><select id="drive-source" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={sourceId} onChange={(event) => setSourceId(event.target.value)} disabled={driveLoading || loading}><option value="">{driveLoading ? "Chargement de la bibliothèque privée..." : "Sélectionner une source"}</option>{driveEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.kind === "FOLDER" ? "📁" : "📄"} {entry.relativePath || entry.name}</option>)}</select><Button type="button" variant="outline" onClick={importFromDrive} disabled={loading || !sourceId}><FileUp className="mr-2 h-4 w-4" />Lancer l'analyse sécurisée</Button></CardContent>
      </Card>

      <Card><CardContent className="pt-6"><form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><Label>Titre principal *</Label><Input {...register("displayTitle")} placeholder="Titre affiché dans la langue principale" />{errors.displayTitle && <p className="text-xs text-destructive mt-1">{errors.displayTitle.message}</p>}</div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Langue principale *</Label><Select defaultValue="MULTI" onValueChange={(value) => setValue("primaryLanguage", value as CreateContentInput["primaryLanguage"], { shouldValidate: true })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AR">Arabe</SelectItem><SelectItem value="FR">Français</SelectItem><SelectItem value="EN">Anglais</SelectItem><SelectItem value="MULTI">Multilingue</SelectItem></SelectContent></Select></div>
          <div><Label>Type *</Label><Select onValueChange={(value) => setValue("contentType", value as CreateContentInput["contentType"], { shouldValidate: true })}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="COURSE">Cours vidéo</SelectItem><SelectItem value="BOOK">Livre</SelectItem><SelectItem value="SERIES">Série</SelectItem><SelectItem value="ANIMATION">Animation</SelectItem></SelectContent></Select>{errors.contentType && <p className="text-xs text-destructive mt-1">{errors.contentType.message}</p>}</div>
          <div><Label>Audience *</Label><Select defaultValue="LEARNER" onValueChange={(value) => setValue("audience", value as CreateContentInput["audience"], { shouldValidate: true })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LEARNER">Élèves / parents</SelectItem><SelectItem value="TEACHER">Enseignants</SelectItem><SelectItem value="INTERNAL">Interne</SelectItem></SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-4"><div><Label>Titre français</Label><Input {...register("titleFr")} /></div><div><Label>Titre arabe</Label><Input dir="rtl" {...register("titleAr")} /></div></div><div><Label>Titre anglais</Label><Input {...register("titleEn")} /></div>
        <div className="grid grid-cols-2 gap-4"><div><Label>Description française</Label><Textarea {...register("descriptionFr")} rows={3} /></div><div><Label>Description arabe</Label><Textarea dir="rtl" {...register("descriptionAr")} rows={3} /></div></div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Année (optionnel)</Label><Select onValueChange={(value) => setValue("grade", value as CreateContentInput["grade"])}><SelectTrigger><SelectValue placeholder="À confirmer" /></SelectTrigger><SelectContent>{[1,2,3,4,5,6].map((n) => <SelectItem key={n} value={`GRADE_${n}`}>Année {n}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Matière (optionnel)</Label><Select onValueChange={(value) => setValue("subject", value as CreateContentInput["subject"])}><SelectTrigger><SelectValue placeholder="À confirmer" /></SelectTrigger><SelectContent>{[["ARABIC","Arabe"],["FRENCH","Français"],["MATH","Mathématiques"],["SCIENCE","Sciences"],["ISLAMIC","Islamique"],["HISTORY","Histoire-Géo"],["CIVIC","Éducation civique"],["ARTS","Arts"],["ENGLISH","Anglais"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Catégorie</Label><Select onValueChange={(value) => setValue("category", value as CreateContentInput["category"])}><SelectTrigger><SelectValue placeholder="À classer" /></SelectTrigger><SelectContent><SelectItem value="STORYBOOK">Livre d'histoire</SelectItem><SelectItem value="STUDENT_WORKBOOK">Cahier élève</SelectItem><SelectItem value="TEACHER_RESOURCE">Ressource enseignant</SelectItem><SelectItem value="REVIEW_REQUIRED">À vérifier</SelectItem></SelectContent></Select></div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-4"><div><p className="font-medium">Contenu gratuit</p><p className="text-sm text-muted-foreground">Accessible sans abonnement, après publication sécurisée.</p></div><Switch checked={isFree} onCheckedChange={(value) => { setIsFree(value); setValue("isFree", value) }} /></div>
        {!isFree && <div><Label>Prix (TND)</Label><Input type="number" min="0.001" step="0.001" {...register("price", { valueAsNumber: true })} placeholder="15.000" /></div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Enregistrer le brouillon</Button>
      </form></CardContent></Card>
    </div>
  )
}
