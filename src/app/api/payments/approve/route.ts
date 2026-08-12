import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { approvePaymentSchema } from "@/lib/validations"
import { approvePayment, rejectPayment } from "@/lib/payment"
import { sendPushToUser } from "@/lib/push"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = approvePaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    if (parsed.data.action === "REJECT") {
      const payment = await rejectPayment(parsed.data.paymentId, parsed.data.reason)
      return NextResponse.json({ payment, message: "Paiement refusé" })
    }

    const result = await approvePayment(
      session.user.id,
      parsed.data.paymentId,
      parsed.data.reason
    )
    if (result.targetUserId) {
      void sendPushToUser(result.targetUserId, {
        title: "Amenallah",
        body: "Votre abonnement a été activé. Bon apprentissage !",
        data: { type: "subscription" },
      })
    }
    return NextResponse.json({
      message: "Paiement approuvé et abonnement activé",
      ...result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
