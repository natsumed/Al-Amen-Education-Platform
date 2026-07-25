"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Library, CreditCard, GraduationCap } from "lucide-react"

export default function TeacherDashboard() {
  const { user } = useCurrentUser()
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-sky-50 border border-primary/10 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Bienvenue, {user?.name?.split(" ")[0] || "Enseignant"}
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl">
              Accédez aux vidéos, PDF et animations pour préparer vos cours.
              Un abonnement enseignant débloque le téléchargement et les ressources premium.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardContent className="p-6 space-y-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Explorer</h3>
            <p className="text-sm text-muted-foreground">Parcourir le catalogue pédagogique</p>
            <Link href="/teacher/browse">
              <Button size="sm">Ouvrir</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardContent className="p-6 space-y-3">
            <Library className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Bibliothèque</h3>
            <p className="text-sm text-muted-foreground">Vos ressources enregistrées</p>
            <Link href="/teacher/library">
              <Button size="sm" variant="outline">
                Voir
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardContent className="p-6 space-y-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Abonnement</h3>
            <p className="text-sm text-muted-foreground">Gérer votre accès enseignant</p>
            <Link href="/teacher/subscription">
              <Button size="sm" variant="outline">
                Gérer
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
