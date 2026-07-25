"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SubscriptionPeriod } from "@/components/subscription/subscription-period"

export default function AdminPremiumAccountsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/subscriptions?status=ACTIVE")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comptes premium</h1>
          <p className="text-muted-foreground mt-1">
            Abonnements actifs avec dates de début et de fin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/payments" className="text-primary hover:underline">Tous</Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/admin/payments/pending" className="text-primary hover:underline">En attente</Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/admin/payments/manual" className="text-primary hover:underline">Activation</Link>
        </div>
      </div>

      <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Période</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-10 w-full my-4" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Aucun abonnement actif
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.user?.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.user?.email} · #{s.user?.publicId}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.user?.role}</TableCell>
                  <TableCell className="text-xs">{s.plan}</TableCell>
                  <TableCell>
                    <Badge variant="success">{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <SubscriptionPeriod startDate={s.startDate} endDate={s.endDate} />
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
