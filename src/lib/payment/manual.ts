import { prisma } from "../prisma"
import {
  calculateSubscriptionEnd,
  getPlanDurationDays,
  getPlanPrice,
} from "../utils"
import { sendSubscriptionConfirmation } from "../email"
import { resolveUserByIdentifier } from "../user-id"

export interface ManualActivationInput {
  /** UUID, 8-digit publicId, or email */
  targetUserId: string
  plan: "STUDENT_MONTHLY" | "STUDENT_YEARLY" | "TEACHER_MONTHLY" | "TEACHER_YEARLY"
  durationDays: number
  reason?: string
  /** When approving an existing PENDING payment, skip creating another Payment row */
  skipPaymentRecord?: boolean
}

export async function manualActivateSubscription(
  adminId: string,
  input: ManualActivationInput
) {
  const { plan, durationDays, reason, skipPaymentRecord } = input

  const targetUser = await resolveUserByIdentifier(input.targetUserId)
  if (!targetUser) {
    throw new Error(
      "Utilisateur introuvable. Utilisez l'ID à 8 chiffres, l'email, ou l'UUID."
    )
  }

  const startDate = new Date()
  const endDate = calculateSubscriptionEnd(durationDays, startDate)

  const log = await prisma.manualActivationLog.create({
    data: {
      adminId,
      targetUserId: targetUser.id,
      plan,
      durationDays,
      reason,
    },
  })

  const existingSub = await prisma.subscription.findFirst({
    where: { userId: targetUser.id },
    orderBy: { createdAt: "desc" },
  })

  let subscription
  if (existingSub) {
    subscription = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { plan, status: "ACTIVE", endDate, startDate, autoRenew: false },
    })
  } else {
    subscription = await prisma.subscription.create({
      data: {
        userId: targetUser.id,
        plan,
        status: "ACTIVE",
        endDate,
        startDate,
      },
    })
  }

  let payment = null
  if (!skipPaymentRecord) {
    payment = await prisma.payment.create({
      data: {
        userId: adminId,
        beneficiaryUserId: targetUser.id,
        amount: getPlanPrice(plan),
        currency: "TND",
        provider: "MANUAL",
        status: "SUCCESS",
        transactionRef: `MANUAL-ACT-${log.id.slice(0, 8)}`,
        itemType: "SUBSCRIPTION",
        itemId: plan,
      },
    })
  }

  sendSubscriptionConfirmation(
    targetUser.email,
    targetUser.fullName,
    plan,
    endDate
  ).catch(console.error)

  return {
    subscription,
    payment,
    log,
    user: {
      id: targetUser.id,
      publicId: targetUser.publicId,
      email: targetUser.email,
      fullName: targetUser.fullName,
    },
  }
}

/** Approve a PENDING payment and activate subscription for payer or beneficiary. */
export async function approvePayment(adminId: string, paymentId: string, reason?: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { id: true, email: true, fullName: true } },
      beneficiary: { select: { id: true, email: true, fullName: true } },
    },
  })

  if (!payment) throw new Error("Paiement introuvable")
  if (payment.status !== "PENDING") throw new Error("Ce paiement n'est plus en attente")

  const target = payment.beneficiary || payment.user

  const plan = (payment.itemId || "STUDENT_MONTHLY") as ManualActivationInput["plan"]
  const durationDays = getPlanDurationDays(plan)

  const result = await manualActivateSubscription(adminId, {
    targetUserId: target.id,
    plan,
    durationDays,
    reason: reason || `Approbation paiement ${payment.id}`,
    skipPaymentRecord: true,
  })

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      transactionRef: payment.transactionRef || `MANUAL-${Date.now()}`,
    },
  })

  return { ...result, payment: updatedPayment, targetUserId: target.id }
}

export async function rejectPayment(paymentId: string, reason?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error("Paiement introuvable")
  if (payment.status !== "PENDING") throw new Error("Ce paiement n'est plus en attente")

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "FAILED",
      transactionRef: reason ? `REJECTED:${reason.slice(0, 80)}` : `REJECTED-${Date.now()}`,
    },
  })
}
