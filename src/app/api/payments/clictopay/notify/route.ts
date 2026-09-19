import { NextRequest, NextResponse } from "next/server"
import { getClicToPayReadiness } from "@/lib/payment/clictopay"
import { processClicToPayNotification } from "@/lib/payment"

const MAX_CALLBACK_BYTES = 64 * 1024

export async function POST(req: NextRequest) {
  if (!getClicToPayReadiness().available) {
    return NextResponse.json({ error: "ClicToPay unavailable" }, { status: 503 })
  }
  const declared = Number(req.headers.get("content-length") || 0)
  if (declared > MAX_CALLBACK_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  const contentType = req.headers.get("content-type")?.toLowerCase() || ""
  if (!contentType.includes("application/json") && !contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 })
  }
  const rawBody = Buffer.from(await req.arrayBuffer())
  if (rawBody.byteLength > MAX_CALLBACK_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  try {
    const payment = await processClicToPayNotification(rawBody, req.headers)
    return NextResponse.json({ received: true, status: payment.status })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_CALLBACK_FAILED"
    console.error("ClicToPay notification rejected", { code })
    const status = code === "PAYMENT_NOTIFICATION_INVALID" ? 401 : code === "PAYMENT_NOT_FOUND" ? 404 : 503
    return NextResponse.json({ error: code }, { status })
  }
}
