import { NextResponse } from "next/server"
import { getAvailablePaymentMethods } from "@/lib/payment"

export async function GET() {
  return NextResponse.json({ methods: getAvailablePaymentMethods() }, { headers: { "Cache-Control": "no-store" } })
}
