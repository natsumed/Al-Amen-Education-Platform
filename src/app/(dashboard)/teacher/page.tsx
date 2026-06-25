"use client"
import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
export default function TeacherDashboard() {
  const { user } = useCurrentUser()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bienvenue, {user?.name?.split(" ")[0] || "Enseignant"} 👋</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card><CardContent className="p-6"><h3 className="font-semibold mb-3">Explorer les ressources</h3><Link href="/teacher/browse"><Button>Parcourir</Button></Link></CardContent></Card>
        <Card><CardContent className="p-6"><h3 className="font-semibold mb-3">Mon abonnement</h3><Link href="/teacher/subscription"><Button variant="outline">Gérer</Button></Link></CardContent></Card>
      </div>
    </div>
  )
}
