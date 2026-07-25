"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createContentSchema, type CreateContentInput } from "@/lib/validations"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isFree, setIsFree] = useState(true)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateContentInput>({ resolver: zodResolver(createContentSchema), defaultValues: { isFree: true, status: "PUBLISHED" } })

  const onSubmit = async (data: CreateContentInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, isFree }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur") }
      toast.success("Contenu créé!")
      router.push("/admin/content")
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/content"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Ajouter un contenu</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Titre (Français)</Label><Input {...register("titleFr")} placeholder="Titre en français" />{errors.titleFr && <p className="text-xs text-destructive mt-1">{errors.titleFr.message}</p>}</div>
              <div><Label>Titre (العربية)</Label><Input {...register("titleAr")} dir="rtl" placeholder="العنوان بالعربية" />{errors.titleAr && <p className="text-xs text-destructive mt-1">{errors.titleAr.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Description (FR)</Label><Textarea {...register("descriptionFr")} rows={3} placeholder="Description..." /></div>
              <div><Label>Description (AR)</Label><Textarea {...register("descriptionAr")} dir="rtl" rows={3} placeholder="الوصف..." /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type</Label>
                <Select onValueChange={(v) => setValue("contentType", v as any)}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURSE">Cours vidéo</SelectItem>
                    <SelectItem value="BOOK">Livre PDF</SelectItem>
                    <SelectItem value="SERIES">Série</SelectItem>
                    <SelectItem value="ANIMATION">Animation</SelectItem>
                  </SelectContent>
                </Select>
                {errors.contentType && <p className="text-xs text-destructive mt-1">{errors.contentType.message}</p>}
              </div>
              <div>
                <Label>Année</Label>
                <Select onValueChange={(v) => setValue("grade", v as any)}>
                  <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6].map(n => <SelectItem key={n} value={`GRADE_${n}`}>Année {n}</SelectItem>)}</SelectContent>
                </Select>
                {errors.grade && <p className="text-xs text-destructive mt-1">{errors.grade.message}</p>}
              </div>
              <div>
                <Label>Matière</Label>
                <Select onValueChange={(v) => setValue("subject", v as any)}>
                  <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARABIC">Arabe</SelectItem>
                    <SelectItem value="FRENCH">Français</SelectItem>
                    <SelectItem value="MATH">Mathématiques</SelectItem>
                    <SelectItem value="SCIENCE">Sciences</SelectItem>
                    <SelectItem value="ISLAMIC">Islamique</SelectItem>
                    <SelectItem value="HISTORY">Histoire-Géo</SelectItem>
                    <SelectItem value="CIVIC">Éd. civique</SelectItem>
                    <SelectItem value="ARTS">Arts</SelectItem>
                    <SelectItem value="ENGLISH">Anglais</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>}
              </div>
            </div>
            <div><Label>Lien YouTube ou Drive (vidéo)</Label><Input {...register("youtubeUrl")} placeholder="https://youtube.com/... ou https://drive.google.com/file/d/..." /><p className="text-xs text-muted-foreground mt-1">Les fichiers Drive seront collés ici quand ils seront prêts.</p></div>
            <div><Label>Lien PDF / livre (Drive ou URL)</Label><Input {...register("pdfUrl")} placeholder="https://drive.google.com/file/d/..." /></div>
            <div><Label>Lien animation / GIF (Drive ou URL)</Label><Input {...register("gifUrl")} placeholder="https://drive.google.com/file/d/... ou .gif" /></div>
            <div><Label>Miniature (URL optionnelle)</Label><Input {...register("thumbnailUrl")} placeholder="https://..." /></div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div><p className="font-medium">Contenu gratuit</p><p className="text-sm text-muted-foreground">Accessible sans abonnement</p></div>
              <Switch checked={isFree} onCheckedChange={(v) => { setIsFree(v); setValue("isFree", v) }} />
            </div>
            {!isFree && <div><Label>Prix (TND)</Label><Input type="number" step="0.5" {...register("price", { valueAsNumber: true })} placeholder="15.00" /></div>}
            <div>
              <Label>Statut</Label>
              <Select defaultValue="PUBLISHED" onValueChange={(v) => setValue("status", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PUBLISHED">Publié</SelectItem><SelectItem value="DRAFT">Brouillon</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Créer le contenu</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
