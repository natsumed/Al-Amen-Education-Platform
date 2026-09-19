import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { millisToTnd } from "@/lib/payment"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { user: { select: { fullName: true } }, beneficiary: { select: { fullName: true } } },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "ADMIN" && payment.userId !== user.id && payment.beneficiaryUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!["SUCCEEDED", "REFUNDED"].includes(payment.status)) {
    return NextResponse.json({ error: "Receipt unavailable" }, { status: 409 })
  }
  const body = [
    "AMENALLAH EDITION — REÇU DE PAIEMENT",
    `Référence: ${payment.merchantOrderRef}`,
    `Statut: ${payment.status}`,
    `Payeur: ${payment.user.fullName}`,
    `Bénéficiaire: ${payment.beneficiary?.fullName || payment.user.fullName}`,
    `Produit: ${payment.productTitle}`,
    `Montant: ${millisToTnd(payment.amountMillis).toFixed(3)} TND`,
    `Date: ${(payment.settledAt || payment.createdAt).toISOString()}`,
    "Les données de carte sont traitées exclusivement par le serveur de paiement SMT/SPS.",
  ].join("\n")
  return new NextResponse(body, { headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Disposition": `attachment; filename="amenallah-${payment.merchantOrderRef}.txt"`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } })
}
