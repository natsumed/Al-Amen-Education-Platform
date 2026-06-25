"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function ProfilePage() {
  const { user } = useCurrentUser()
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-lg space-y-6">
            <h1 className="text-2xl font-bold">Mon profil</h1>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{user?.name}</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{user?.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
