"use client"
import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
export default function ParentDashboard() {
  const { user } = useCurrentUser()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bonjour, {user?.name?.split(" ")[0] || "Parent"} 👋</h1>
      <Card><CardContent className="p-6">
        <h3 className="font-semibold mb-3">Suivre mes enfants</h3>
        <p className="text-muted-foreground text-sm mb-4">Ajoutez vos enfants pour suivre leur progression.</p>
        <Link href="/parent/children"><Button>Gérer mes enfants</Button></Link>
      </CardContent></Card>
    </div>
  )
}
