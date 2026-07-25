"use client"

import { useState } from "react"
import Link from "next/link"
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
  const [success, setSuccess] = useState<{
    publicId?: string
    name?: string
    startDate?: string
    endDate?: string
  } | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ManualActivationInput>({
    resolver: zodResolver(manualActivationSchema),
    defaultValues: { durationDays: 30 },
  })

  const onSubmit = async (data: ManualActivationInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/manual-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(typeof d.error === "string" ? d.error : "Erreur")
      toast.success("Abonnement activé — visible dans Paiements")
      setSuccess({
        publicId: d.user?.publicId,
        name: d.user?.fullName,
        startDate: d.subscription?.startDate,
        endDate: d.subscription?.endDate,
      })
      reset({ durationDays: 30, targetUserId: "", reason: "" })
      setTimeout(() => setSuccess(null), 8000)
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activation manuelle</h1>
          <p className="text-muted-foreground mt-1">
            Active un abonnement et crée un paiement MANUAL (SUCCESS) dans l&apos;historique.
          </p>
        </div>
        <Link href="/admin/payments" className="text-sm text-primary hover:underline">
          Voir les paiements
        </Link>
      </div>
      <Card className="shadow-sm border-0 ring-1 ring-border/60">
        <CardHeader>
          <CardTitle>Activer un abonnement</CardTitle>
          <CardDescription>
            Utilisez le <strong>n° compte à 8 chiffres</strong>, l&apos;email, ou l&apos;UUID interne.
            Exemple élève: <code className="text-xs bg-muted px-1 rounded">10000003</code> ou{" "}
            <code className="text-xs bg-muted px-1 rounded">student@edutunisia.tn</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="flex flex-col gap-1 text-green-800 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">
                  Activé pour {success.name}
                  {success.publicId ? ` (#${success.publicId})` : ""}
                </span>
              </div>
              {success.startDate && success.endDate && (
                <p className="text-xs ms-7">
                  Période: {new Date(success.startDate).toLocaleDateString("fr-TN")} →{" "}
                  {new Date(success.endDate).toLocaleDateString("fr-TN")}
                </p>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>N° compte (8 chiffres), email ou ID</Label>
              <Input {...register("targetUserId")} placeholder="10000003 ou email@..." />
              {errors.targetUserId && (
                <p className="text-xs text-destructive mt-1">{errors.targetUserId.message}</p>
              )}
            </div>
            <div>
              <Label>Plan</Label>
              <Select onValueChange={(v) => setValue("plan", v as ManualActivationInput["plan"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT_MONTHLY">Élève — Mensuel (15 TND)</SelectItem>
                  <SelectItem value="STUDENT_YEARLY">Élève — Annuel (120 TND)</SelectItem>
                  <SelectItem value="TEACHER_MONTHLY">Enseignant — Mensuel (25 TND)</SelectItem>
                  <SelectItem value="TEACHER_YEARLY">Enseignant — Annuel (200 TND)</SelectItem>
                </SelectContent>
              </Select>
              {errors.plan && <p className="text-xs text-destructive mt-1">{errors.plan.message}</p>}
            </div>
            <div>
              <Label>Durée (jours)</Label>
              <Input type="number" {...register("durationDays", { valueAsNumber: true })} min={1} max={365} />
              {errors.durationDays && (
                <p className="text-xs text-destructive mt-1">{errors.durationDays.message}</p>
              )}
            </div>
            <div>
              <Label>Raison / Note (optionnel)</Label>
              <Textarea {...register("reason")} placeholder="ex: Espèces reçues le 21/07/2026" rows={2} />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Activer l&apos;abonnement
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
