import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPaymentSchema } from "@/lib/validations"
import { getPaymentProvider } from "@/lib/payment"
import { getPlanPrice } from "@/lib/utils"
import { resolveUserByIdentifier } from "@/lib/user-id"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = createPaymentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { provider, itemType, plan, beneficiaryId } = parsed.data

    if (itemType === "SUBSCRIPTION" && !plan) {
      return NextResponse.json({ error: "Plan requis" }, { status: 400 })
    }

    // Parent must pay for a linked student — never for themselves as content consumers
    let beneficiaryUserId: string | null = null
    if (session.user.role === "PARENT") {
      if (!beneficiaryId) {
        return NextResponse.json(
          { error: "Indiquez l'élève (ID 8 chiffres ou email) pour lequel vous payez" },
          { status: 400 }
        )
      }
      const child = await resolveUserByIdentifier(beneficiaryId)
      if (!child || child.role !== "STUDENT") {
        return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
      }
      const link = await prisma.parentLink.findUnique({
        where: {
          parentId_studentId: { parentId: session.user.id, studentId: child.id },
        },
      })
      if (!link || link.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Lien parent–élève non accepté. L'élève doit d'abord accepter l'invitation." },
          { status: 403 }
        )
      }
      if (plan && !plan.startsWith("STUDENT_")) {
        return NextResponse.json({ error: "Un parent ne peut payer que des plans élève" }, { status: 400 })
      }
      beneficiaryUserId = child.id
    }

    // Teachers / students pay for themselves
    if (session.user.role === "TEACHER" && plan && !plan.startsWith("TEACHER_")) {
      return NextResponse.json({ error: "Choisissez un plan enseignant" }, { status: 400 })
    }
    if (session.user.role === "STUDENT" && plan && !plan.startsWith("STUDENT_")) {
      return NextResponse.json({ error: "Choisissez un plan élève" }, { status: 400 })
    }

    const amount = plan ? getPlanPrice(plan) : 0
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        beneficiaryUserId,
        amount,
        provider,
        itemType,
        itemId: plan,
        status: "PENDING",
      },
    })

    if (provider === "MANUAL") {
      return NextResponse.json({
        message: "Paiement en attente de confirmation admin",
        paymentId: payment.id,
      })
    }

    const paymentProvider = getPaymentProvider(provider)
    const paymentSession = await paymentProvider.createPayment({
      amount,
      currency: "TND",
      description: `Abonnement ${plan}`,
      returnUrl: `${appUrl}/checkout/return?paymentId=${payment.id}`,
      paymentId: payment.id,
    })

    return NextResponse.json({ paymentSession, paymentId: payment.id })
  } catch (error) {
    console.error("Payment create error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
