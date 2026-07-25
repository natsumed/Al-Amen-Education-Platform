"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { Ban, Copy } from "lucide-react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const debouncedSearch = useDebounce(search, 400)

  const fetchUsers = async () => {
    setLoading(true)
    const q = debouncedSearch ? `?search=${debouncedSearch}` : ""
    const res = await fetch(`/api/users${q}`)
    const data = await res.json()
    setUsers(data.items || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [debouncedSearch])

  const toggleBan = async (id: string, isBanned: boolean) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned }),
    })
    if (res.ok) {
      toast.success(isBanned ? "Utilisateur débanni" : "Utilisateur banni")
      fetchUsers()
    } else toast.error("Erreur")
  }

  const copyId = (publicId: string) => {
    navigator.clipboard.writeText(publicId)
    toast.success(`N° ${publicId} copié`)
  }

  const ROLE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
    ADMIN: "default",
    TEACHER: "secondary",
    STUDENT: "outline",
    PARENT: "outline",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-muted-foreground mt-1">
          Chaque compte a un n° à 8 chiffres pour l&apos;activation manuelle.
        </p>
      </div>
      <Input
        className="max-w-sm"
        placeholder="Nom, email ou n° compte..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° compte</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => copyId(u.publicId)}
                      className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
                      title="Copier pour activation manuelle"
                    >
                      {u.publicId}
                      <Copy className="h-3 w-3" />
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_COLORS[u.role] || "outline"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isBanned ? "destructive" : "success"}>
                      {u.isBanned ? "Banni" : "Actif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={u.isBanned ? "outline" : "ghost"}
                      className={u.isBanned ? "" : "text-destructive"}
                      onClick={() => toggleBan(u.id, u.isBanned)}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      {u.isBanned ? "Débannir" : "Bannir"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
