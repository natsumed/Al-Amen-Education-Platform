"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { toast } from "sonner"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user } = useCurrentUser()
  const [publicId, setPublicId] = useState<string | null>(null)
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => setPublicId(d.user?.publicId || null))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex bg-mesh">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-lg space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
            <Card className="border-0 shadow-soft ring-1 ring-border/60">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{user?.name}</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>
                {publicId && (
                  <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">N° compte (8 chiffres)</p>
                      <p className="font-mono text-lg font-semibold tracking-wider">{publicId}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(publicId)
                        toast.success("N° copié")
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copier
                    </Button>
                  </div>
                )}
                <Link href="/settings">
                  <Button variant="outline" className="w-full">
                    Modifier les paramètres
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
