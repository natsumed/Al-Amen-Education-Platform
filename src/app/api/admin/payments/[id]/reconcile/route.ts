import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { reconcileClicToPayPayment } from "@/lib/payment"

function validOrigin(req: NextRequest) {
  const origin = req.headers.get("origin")
  if (!origin) return true
  const allowed = [process.env.NEXT_PUBLIC_APP_URL, process.env.AUTH_URL, process.env.NEXTAUTH_URL]
    .filter(Boolean)
    .map((value) => new URL(value!).origin)
  return allowed.includes(origin)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validOrigin(req)) return NextResponse.json({ error: "Origin forbidden" }, { status: 403 })
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const mfaAt = session.user.mfaAuthenticatedAt || 0
  if (session.user.mfaEnrollmentRequired || Date.now() - mfaAt > 30 * 60_000) {
    return NextResponse.json({ error: "Une authentification MFA récente est requise", code: "MFA_STEP_UP_REQUIRED" }, { status: 403 })
  }
  try {
    const { id } = await params
    const payment = await reconcileClicToPayPayment(id)
    return NextResponse.json({ payment }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_RECONCILIATION_FAILED"
    return NextResponse.json({ error: code, code }, { status: code.includes("NOT_FOUND") ? 404 : 409 })
  }
}
