import { prisma } from "../prisma"
import { calculateSubscriptionEnd } from "../utils"
import { sendSubscriptionConfirmation } from "../email"

export interface ManualActivationInput {
  targetUserId: string
  plan: "STUDENT_MONTHLY" | "STUDENT_YEARLY" | "TEACHER_MONTHLY" | "TEACHER_YEARLY"
  durationDays: number
  reason?: string
}

export async function manualActivateSubscription(
  adminId: string,
  input: ManualActivationInput
) {
  const { targetUserId, plan, durationDays, reason } = input

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, fullName: true },
  })
  if (!targetUser) throw new Error("User not found")

  const endDate = calculateSubscriptionEnd(durationDays)

  const log = await prisma.manualActivationLog.create({
    data: { adminId, targetUserId, plan, durationDays, reason },
  })

  const existingSub = await prisma.subscription.findFirst({
    where: { userId: targetUserId },
    orderBy: { createdAt: "desc" },
  })

  let subscription
  if (existingSub) {
    subscription = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: { plan, status: "ACTIVE", endDate, startDate: new Date() },
    })
  } else {
    subscription = await prisma.subscription.create({
      data: {
        userId: targetUserId,
        plan,
        status: "ACTIVE",
        endDate,
        startDate: new Date(),
      },
    })
  }

  sendSubscriptionConfirmation(targetUser.email, targetUser.fullName, plan, endDate).catch(console.error)

  return { subscription, log }
}
