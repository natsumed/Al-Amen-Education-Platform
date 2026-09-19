import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true, userId: true, beneficiaryUserId: true, merchantOrderRef: true, status: true,
      provider: true, productKind: true, productId: true, productTitle: true, amountMillis: true,
      currency: true, expiresAt: true, settledAt: true, refundedAt: true, failureCode: true,
      createdAt: true, updatedAt: true,
    },
  })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "ADMIN" && payment.userId !== user.id && payment.beneficiaryUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const beneficiaryView = payment.beneficiaryUserId === user.id && payment.userId !== user.id && user.role !== "ADMIN"
  return NextResponse.json(beneficiaryView ? {
    paymentId: payment.id, status: payment.status, productKind: payment.productKind,
    productId: payment.productId, entitlementActive: payment.status === "SUCCEEDED",
  } : payment, { headers: { "Cache-Control": "private, no-store" } })
}
