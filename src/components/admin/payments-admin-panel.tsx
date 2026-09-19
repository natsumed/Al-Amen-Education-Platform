"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Check, X, Loader2, RefreshCw, Undo2 } from "lucide-react"
import { SubscriptionPeriod } from "@/components/subscription/subscription-period"

const STATUS_COLORS: Record<string, "secondary" | "success" | "destructive" | "warning"> = {
  CREATED: "warning",
  PENDING_REVIEW: "warning",
  REDIRECT_READY: "warning",
  PROCESSING: "warning",
  RECONCILIATION_REQUIRED: "destructive",
  SUCCEEDED: "success",
  DECLINED: "destructive",
  CANCELLED: "secondary",
  EXPIRED: "secondary",
  INITIATION_FAILED: "destructive",
  REFUND_PENDING: "warning",
  REFUNDED: "secondary",
}

type Mode = "all" | "pending"

export function PaymentsAdminPanel({ mode = "all" }: { mode?: Mode }) {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    const qs = mode === "pending" ? "?status=PENDING_REVIEW" : ""
    fetch(`/api/payments${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setPayments(d.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [mode])

  const act = async (paymentId: string, action: "APPROVE" | "REJECT") => {
    const reason = window.prompt(action === "APPROVE" ? "Référence/preuve de réception des espèces" : "Motif du refus")?.trim()
    if (!reason) return
    setBusyId(paymentId)
    try {
      const res = await fetch("/api/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action, reason, cashReceived: action === "APPROVE" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success(action === "APPROVE" ? "Paiement approuvé — abonnement activé" : "Paiement refusé")
      load()
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setBusyId(null)
    }
  }

  const reconcile = async (paymentId: string) => {
    setBusyId(paymentId)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reconcile`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success(`Rapprochement terminé : ${data.payment.status}`)
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur")
    } finally {
      setBusyId(null)
    }
  }

  const refund = async (payment: any) => {
    const reason = window.prompt("Motif du remboursement")?.trim()
    if (!reason) return
    const confirmManual = payment.provider === "MANUAL_CASH" && payment.status === "REFUND_PENDING"
    setBusyId(payment.id)
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: confirmManual ? "CONFIRM" : "REQUEST",
          reason,
          providerConfirmed: confirmManual,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success(data.message || (confirmManual ? "Remboursement confirmé" : "Remboursement demandé"))
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur")
    } finally {
      setBusyId(null)
    }
  }

  const pending = payments.filter((p) => p.status === "PENDING_REVIEW" && p.provider === "MANUAL_CASH")
  const title = mode === "pending" ? "Paiements en attente" : "Tous les paiements"
  const subtitle =
    mode === "pending"
      ? "Approuvez ou refusez les demandes espèces / virement."
      : "Paiements espèces et, après certification SMT, transactions ClicToPay vérifiées."

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/payments" className="text-primary hover:underline">Tous</Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/admin/payments/pending" className="text-primary hover:underline">En attente</Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/admin/payments/premium" className="text-primary hover:underline">Premium</Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/admin/payments/manual" className="text-primary hover:underline">Activation</Link>
        </div>
      </div>

      {(mode === "all" ? pending : payments).length > 0 && mode !== "pending" && pending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">En attente ({pending.length})</CardTitle>
            <CardDescription>Action requise — paiement espèces / virement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((p) => (
              <PendingRow key={p.id} p={p} busyId={busyId} act={act} />
            ))}
          </CardContent>
        </Card>
      )}

      {mode === "pending" && (
        <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">File d&apos;attente ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucun paiement en attente</p>
            ) : (
              payments.map((p) => <PendingRow key={p.id} p={p} busyId={busyId} act={act} />)
            )}
          </CardContent>
        </Card>
      )}

      {mode === "all" && (
        <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payeur</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Aucun paiement
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{p.user?.fullName}</div>
                      <div className="text-xs text-muted-foreground">#{p.user?.publicId}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.beneficiary ? (
                        <>
                          <div className="font-medium">{p.beneficiary.fullName}</div>
                          <div className="text-xs text-muted-foreground">#{p.beneficiary.publicId}</div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(p.amountMillis) / 1000)}</TableCell>
                    <TableCell className="text-xs">{p.productTitle || p.productId}</TableCell>
                    <TableCell className="text-xs">{p.provider}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[p.status] || "secondary"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.subscriptionPeriod ? (
                        <SubscriptionPeriod
                          startDate={p.subscriptionPeriod.startDate}
                          endDate={p.subscriptionPeriod.endDate}
                          showDaysLeft={false}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.provider === "CLICTOPAY" && ["REDIRECT_READY", "PROCESSING", "RECONCILIATION_REQUIRED", "REFUND_PENDING"].includes(p.status) && (
                          <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => void reconcile(p.id)}>
                            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Vérifier
                          </Button>
                        )}
                        {p.status === "SUCCEEDED" && (
                          <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => void refund(p)}>
                            <Undo2 className="mr-1 h-3.5 w-3.5" /> Rembourser
                          </Button>
                        )}
                        {p.provider === "MANUAL_CASH" && p.status === "REFUND_PENDING" && (
                          <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => void refund(p)}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Confirmer retour espèces
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function PendingRow({
  p,
  busyId,
  act,
}: {
  p: any
  busyId: string | null
  act: (id: string, action: "APPROVE" | "REJECT") => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-background p-4">
      <div>
        <p className="font-semibold">{p.user?.fullName}</p>
        <p className="text-sm text-muted-foreground">
          {p.user?.email}
          {p.user?.publicId ? ` · #${p.user.publicId}` : ""}
        </p>
        {p.beneficiary && (
          <p className="text-sm text-primary mt-1">
            Pour l&apos;élève: {p.beneficiary.fullName} (#{p.beneficiary.publicId})
          </p>
        )}
        <p className="text-sm mt-1">
          {formatCurrency(Number(p.amountMillis) / 1000)} · {p.productTitle || p.productId} · {formatDate(p.createdAt)}
        </p>
      </div>
      {p.provider === "MANUAL_CASH" && p.status === "PENDING_REVIEW" && <div className="flex gap-2">
        <Button size="sm" disabled={busyId === p.id} onClick={() => act(p.id, "APPROVE")}>
          {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
          Approuver
        </Button>
        <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => act(p.id, "REJECT")}>
          <X className="h-4 w-4 mr-1" />
          Refuser
        </Button>
      </div>}
    </div>
  )
}
