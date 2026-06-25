"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/payments").then((r) => r.json()).then((d) => { setPayments(d.items || []); setLoading(false) })
  }, [])

  const STATUS_COLORS: Record<string, any> = { PENDING: "secondary", SUCCESS: "success", FAILED: "destructive", REFUNDED: "warning" }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paiements</h1>
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Montant</TableHead><TableHead>Fournisseur</TableHead><TableHead>Statut</TableHead><TableHead>Réf.</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              : payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">{p.user?.fullName || p.userId}</TableCell>
                <TableCell className="font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                <TableCell><Badge variant="outline">{p.provider}</Badge></TableCell>
                <TableCell><Badge variant={STATUS_COLORS[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{p.transactionRef || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
