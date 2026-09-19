import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { confirmPaymentRefund, requestPaymentRefund } from "@/lib/payment"

const schema = z.object({
  action: z.enum(["REQUEST", "CONFIRM"]),
  reason: z.string().trim().min(5).max(500),
  providerConfirmed: z.boolean().optional(),
})

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
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const { id } = await params
    if (parsed.data.action === "REQUEST") {
      const payment = await requestPaymentRefund(session.user.id, id, parsed.data.reason)
      return NextResponse.json({ payment, message: payment.provider === "CLICTOPAY"
        ? "Demande enregistrée. Le remboursement doit être effectué et confirmé par SMT/SPS."
        : "Demande de remboursement enregistrée." })
    }
    const existing = await prisma.payment.findUnique({ where: { id }, select: { provider: true } })
    if (!existing) return NextResponse.json({ error: "PAYMENT_NOT_FOUND" }, { status: 404 })
    if (existing.provider !== "MANUAL_CASH") {
      return NextResponse.json({ error: "ONLINE_REFUND_PROVIDER_CONFIRMATION_REQUIRED" }, { status: 409 })
    }
    if (!parsed.data.providerConfirmed) {
      return NextResponse.json({ error: "REFUND_CONFIRMATION_REQUIRED" }, { status: 400 })
    }
    const payment = await confirmPaymentRefund(id, session.user.id)
    return NextResponse.json({ payment })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_REFUND_FAILED"
    return NextResponse.json({ error: code, code }, { status: code.includes("NOT_FOUND") ? 404 : 409 })
  }
}
