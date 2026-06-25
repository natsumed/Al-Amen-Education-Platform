"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { Ban } from "lucide-react"

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

  useEffect(() => { fetchUsers() }, [debouncedSearch])

  const toggleBan = async (id: string, isBanned: boolean) => {
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isBanned: !isBanned }) })
    if (res.ok) { toast.success(isBanned ? "Utilisateur débanni" : "Utilisateur banni"); fetchUsers() }
    else toast.error("Erreur")
  }

  const ROLE_COLORS: Record<string, any> = { ADMIN: "default", TEACHER: "secondary", STUDENT: "outline", PARENT: "outline" }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      <Input className="max-w-xs" placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chargement...</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant={ROLE_COLORS[u.role] || "outline"}>{u.role}</Badge></TableCell>
                <TableCell><Badge variant={u.isBanned ? "destructive" : "success"}>{u.isBanned ? "Banni" : "Actif"}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                <TableCell>
                  <Button size="sm" variant={u.isBanned ? "outline" : "ghost"} className={u.isBanned ? "" : "text-destructive"} onClick={() => toggleBan(u.id, u.isBanned)}>
                    <Ban className="h-4 w-4 mr-1" />{u.isBanned ? "Débannir" : "Bannir"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
