import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { approvePaymentSchema } from "@/lib/validations"
import { approveManualCashPayment, rejectManualCashPayment } from "@/lib/payment"
import { sendPushToUser } from "@/lib/push"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const mfaAt = session.user.mfaAuthenticatedAt || 0
    if (session.user.mfaEnrollmentRequired || Date.now() - mfaAt > 30 * 60_000) {
      return NextResponse.json({ error: "Une authentification MFA récente est requise", code: "MFA_STEP_UP_REQUIRED" }, { status: 403 })
    }
    const parsed = approvePaymentSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const { paymentId, action, reason } = parsed.data
    const payment = action === "APPROVE"
      ? await approveManualCashPayment(session.user.id, paymentId, reason)
      : await rejectManualCashPayment(session.user.id, paymentId, reason)
    const targetUserId = payment.beneficiaryUserId || payment.userId
    if (action === "APPROVE") {
      void sendPushToUser(targetUserId, {
        title: "Amenallah",
        body: "Votre paiement est confirmé et votre accès est actif.",
        data: { type: "payment", paymentId: payment.id },
      })
    }
    return NextResponse.json({ payment, targetUserId, message: action === "APPROVE" ? "Paiement confirmé" : "Paiement refusé" })
  } catch (error) {
    const code = error instanceof Error ? error.message : "PAYMENT_REVIEW_FAILED"
    const status = code.includes("FORBIDDEN") ? 403 : code.includes("STATE") ? 409 : 400
    return NextResponse.json({ error: code, code }, { status })
  }
}
