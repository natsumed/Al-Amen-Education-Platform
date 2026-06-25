"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations"
import { Loader2 } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, token }),
      })
      if (res.ok) { toast.success("Mot de passe réinitialisé!"); router.push("/login") }
      else { const d = await res.json(); toast.error(d.error || "Erreur") }
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }

  if (!token) return <Card><CardContent className="pt-6 text-center"><p className="text-destructive">Lien invalide ou expiré.</p><Link href="/forgot-password"><Button className="mt-4">Recommencer</Button></Link></CardContent></Card>

  return (
    <Card>
      <CardHeader><CardTitle>Nouveau mot de passe</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Nouveau mot de passe</Label><Input type="password" placeholder="••••••••" {...register("password")} />{errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}</div>
          <div><Label>Confirmer</Label><Input type="password" placeholder="••••••••" {...register("confirmPassword")} />{errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Enregistrer</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div>Chargement...</div>}><ResetPasswordForm /></Suspense>
}
