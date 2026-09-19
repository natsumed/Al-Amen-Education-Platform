import { createHmac } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { isMockClicToPayEnabled } from "@/lib/payment/clictopay"
import { processClicToPayNotification } from "@/lib/payment"

export async function POST(req: NextRequest) {
  if (!isMockClicToPayEnabled()) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { paymentId?: string }
  if (!body.paymentId) return NextResponse.json({ error: "Payment required" }, { status: 400 })
  const payment = await prisma.payment.findUnique({ where: { id: body.paymentId } })
  if (!payment || payment.userId !== user.id || payment.provider !== "CLICTOPAY") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const payload = Buffer.from(JSON.stringify({
    merchantOrderRef: payment.merchantOrderRef,
    providerEventRef: `MOCK-EVENT-${payment.id}`,
    providerOrderRef: payment.providerOrderRef,
    providerTransactionRef: `MOCK-TX-${payment.merchantOrderRef}`,
    status: "SUCCEEDED",
    amountMillis: payment.amountMillis,
    currency: payment.currency,
  }))
  const signature = createHmac("sha256", process.env.CLICTOPAY_MOCK_SECRET || "amenallah-local-payment-mock")
    .update(payload)
    .digest("hex")
  const headers = new Headers({ "content-type": "application/json", "x-amenallah-mock-signature": signature })
  const result = await processClicToPayNotification(payload, headers)
  return NextResponse.json({ paymentId: result.id, status: result.status })
}
