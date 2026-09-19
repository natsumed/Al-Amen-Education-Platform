import { Prisma } from "@prisma/client"
import { prisma } from "../prisma"
import { resolveUserByIdentifier } from "../user-id"
import { sendSubscriptionConfirmation } from "../email"
import { getPaidSubscriptionPlan, type PaidSubscriptionPlanId } from "./catalog"
import { approveManualCashPayment, rejectManualCashPayment } from "./service"

export interface ManualActivationInput {
  targetUserId: string
  plan: PaidSubscriptionPlanId
  durationDays: number
  reason?: string
  /** @deprecated Complimentary grants never create fake revenue records. */
  skipPaymentRecord?: boolean
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 86_400_000)
}

/** Complimentary access is an ADMIN_GRANT and is deliberately excluded from revenue. */
export async function manualActivateSubscription(adminId: string, input: ManualActivationInput) {
  const targetUser = await resolveUserByIdentifier(input.targetUserId)
  if (!targetUser) throw new Error("Utilisateur introuvable. Utilisez l'ID à 8 chiffres, l'email, ou l'UUID.")
  const plan = getPaidSubscriptionPlan(input.plan)
  if (targetUser.role !== plan.role) throw new Error("Le plan ne correspond pas au rôle de l'utilisateur")
  const durationDays = Math.max(1, Math.min(365, input.durationDays))

  const result = await prisma.$transaction(async (tx) => {
    const now = new Date()
    const current = await tx.subscription.findFirst({
      where: { userId: targetUser.id, status: "ACTIVE" },
      orderBy: { endDate: "desc" },
    })
    const latestGrant = await tx.subscriptionGrant.findFirst({
      where: { userId: targetUser.id, status: "ACTIVE" },
      orderBy: { endsAt: "desc" },
    })
    const startsAt = new Date(Math.max(now.getTime(), current?.endDate.getTime() || 0, latestGrant?.endsAt.getTime() || 0))
    const endsAt = addDays(startsAt, durationDays)
    const log = await tx.manualActivationLog.create({
      data: { adminId, targetUserId: targetUser.id, plan: input.plan, durationDays, reason: input.reason },
    })
    const grant = await tx.subscriptionGrant.create({
      data: {
        userId: targetUser.id,
        plan: input.plan,
        source: "ADMIN_GRANT",
        durationDays,
        startsAt,
        endsAt,
      },
    })
    const subscription = current
      ? await tx.subscription.update({ where: { id: current.id }, data: { plan: input.plan, status: "ACTIVE", endDate: endsAt, autoRenew: false } })
      : await tx.subscription.create({ data: { userId: targetUser.id, plan: input.plan, status: "ACTIVE", startDate: startsAt, endDate: endsAt } })
    await tx.auditEvent.create({
      data: {
        userId: adminId,
        action: "ADMIN_SUBSCRIPTION_GRANT_CREATED",
        targetType: "SubscriptionGrant",
        targetId: grant.id,
        metadata: { targetUserId: targetUser.id, plan: input.plan, durationDays, reason: input.reason?.slice(0, 500) },
      },
    })
    return { subscription, grant, log }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  void sendSubscriptionConfirmation(targetUser.email, targetUser.fullName, input.plan, result.subscription.endDate, targetUser.id)
  return {
    ...result,
    payment: null,
    user: { id: targetUser.id, publicId: targetUser.publicId, email: targetUser.email, fullName: targetUser.fullName },
  }
}

export async function approvePayment(adminId: string, paymentId: string, reason?: string) {
  const payment = await approveManualCashPayment(adminId, paymentId, reason || "Espèces reçues")
  return { payment, targetUserId: payment.beneficiaryUserId || payment.userId }
}

export async function rejectPayment(paymentId: string, reason?: string, adminId = "") {
  return rejectManualCashPayment(adminId || undefined, paymentId, reason || "Paiement en espèces refusé")
}
