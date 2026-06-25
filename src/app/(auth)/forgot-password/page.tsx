"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSent(true)
        toast.success("Email envoyé!")
      } else {
        toast.error("Erreur lors de l'envoi")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Email envoyé!</h2>
          <p className="text-muted-foreground text-sm">Vérifiez votre boîte mail et suivez le lien pour réinitialiser votre mot de passe.</p>
          <Link href="/login"><Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4 mr-2" />Retour à la connexion</Button></Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>Entrez votre email pour recevoir un lien de réinitialisation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="votre@email.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Envoyer le lien
          </Button>
          <Link href="/login"><Button variant="ghost" className="w-full"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
        </form>
      </CardContent>
    </Card>
  )
}
