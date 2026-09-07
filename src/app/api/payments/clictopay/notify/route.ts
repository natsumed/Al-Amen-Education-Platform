import { NextRequest, NextResponse } from "next/server"
import { isClicToPayConfigured } from "@/lib/payment/clictopay"

export async function POST(_req: NextRequest) {
  if (!isClicToPayConfigured()) {
    return NextResponse.json({ error: "ClicToPay is not certified" }, { status: 503 })
  }
  // Never acknowledge or activate a payment until the official SMT kit's
  // signature and server-to-server status verification are implemented.
  return NextResponse.json({ error: "Verification adapter unavailable" }, { status: 503 })
}
