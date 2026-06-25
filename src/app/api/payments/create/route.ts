import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPaymentSchema } from "@/lib/validations"
import { getPaymentProvider } from "@/lib/payment"
import { getPlanPrice, getPlanDurationDays, calculateSubscriptionEnd } from "@/lib/utils"
import { sendSubscriptionConfirmation } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { provider, itemType, plan } = parsed.data

    if (itemType === "SUBSCRIPTION" && !plan) return NextResponse.json({ error: "Plan requis" }, { status: 400 })

    const amount = plan ? getPlanPrice(plan) : 0
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        provider: provider as any,
        itemType,
        itemId: plan,
        status: "PENDING",
      },
    })

    if (provider === "MANUAL") {
      // Manual payment: mark pending and await admin activation
      return NextResponse.json({ message: "Paiement en attente de confirmation admin", paymentId: payment.id })
    }

    const paymentProvider = getPaymentProvider(provider)
    const session2 = await paymentProvider.createPayment({
      amount,
      currency: "TND",
      description: `Abonnement ${plan}`,
      returnUrl: `${appUrl}/checkout/return?paymentId=${payment.id}`,
      paymentId: payment.id,
    })

    return NextResponse.json({ paymentSession: session2, paymentId: payment.id })
  } catch (error) {
    console.error("Payment create error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
