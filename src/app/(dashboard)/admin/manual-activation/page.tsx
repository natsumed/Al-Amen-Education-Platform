"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle } from "lucide-react"
import { manualActivationSchema } from "@/lib/validations"
import type { ManualActivationInput } from "@/lib/validations"

export default function ManualActivationPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ManualActivationInput>({
    resolver: zodResolver(manualActivationSchema),
    defaultValues: { durationDays: 30 }
  })

  const onSubmit = async (data: ManualActivationInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/manual-activation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success("Abonnement activé!")
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) { toast.error(e.message || "Erreur") }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Activation manuelle</h1>
      <Card>
        <CardHeader>
          <CardTitle>Activer un abonnement</CardTitle>
          <CardDescription>Activez manuellement l'abonnement d'un utilisateur (paiement en espèces)</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Abonnement activé avec succès!</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><Label>ID ou email de l'utilisateur</Label><Input {...register("targetUserId")} placeholder="ID utilisateur" />{errors.targetUserId && <p className="text-xs text-destructive mt-1">{errors.targetUserId.message}</p>}</div>
            <div>
              <Label>Plan</Label>
              <Select onValueChange={(v) => setValue("plan", v as any)}>
                <SelectTrigger><SelectValue placeholder="Choisir le plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT_MONTHLY">Élève — Mensuel (15 TND)</SelectItem>
                  <SelectItem value="STUDENT_YEARLY">Élève — Annuel (120 TND)</SelectItem>
                  <SelectItem value="TEACHER_MONTHLY">Enseignant — Mensuel (25 TND)</SelectItem>
                  <SelectItem value="TEACHER_YEARLY">Enseignant — Annuel (200 TND)</SelectItem>
                </SelectContent>
              </Select>
              {errors.plan && <p className="text-xs text-destructive mt-1">{errors.plan.message}</p>}
            </div>
            <div><Label>Durée (jours)</Label><Input type="number" {...register("durationDays", { valueAsNumber: true })} min={1} max={365} />{errors.durationDays && <p className="text-xs text-destructive mt-1">{errors.durationDays.message}</p>}</div>
            <div><Label>Raison / Note (optionnel)</Label><Textarea {...register("reason")} placeholder="ex: Paiement reçu en espèces le 01/01/2025" rows={2} /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Activer l'abonnement</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
