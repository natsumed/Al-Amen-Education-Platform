"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const [status, setStatus] = useState("loading")

  useEffect(() => {
    const token = params.get("token")
    if (!token) { setStatus("invalid"); return }
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then((response) => setStatus(response.ok ? "success" : "invalid"))
      .catch(() => setStatus("invalid"))
  }, [params])

  return <Card className="border-0 shadow-2xl"><CardHeader><CardTitle>{status === "success" ? "Email confirmé" : status === "loading" ? "Confirmation en cours…" : "Lien invalide ou expiré"}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">{status === "success" ? "Votre compte est maintenant actif. Vous pouvez vous connecter." : status === "loading" ? "Veuillez patienter." : "Demandez un nouveau lien depuis la page d'inscription."}</p>{status !== "loading" && <Button asChild><Link href="/login">Se connecter</Link></Button>}</CardContent></Card>
}
