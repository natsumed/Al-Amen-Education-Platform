export const PAID_SUBSCRIPTION_PLANS = {
  STUDENT_MONTHLY: {
    id: "STUDENT_MONTHLY",
    role: "STUDENT",
    amountMillis: 15_000,
    durationDays: 30,
    title: "Abonnement élève mensuel",
  },
  STUDENT_YEARLY: {
    id: "STUDENT_YEARLY",
    role: "STUDENT",
    amountMillis: 120_000,
    durationDays: 365,
    title: "Abonnement élève annuel",
  },
  TEACHER_MONTHLY: {
    id: "TEACHER_MONTHLY",
    role: "TEACHER",
    amountMillis: 25_000,
    durationDays: 30,
    title: "Abonnement enseignant mensuel",
  },
  TEACHER_YEARLY: {
    id: "TEACHER_YEARLY",
    role: "TEACHER",
    amountMillis: 200_000,
    durationDays: 365,
    title: "Abonnement enseignant annuel",
  },
} as const

export type PaidSubscriptionPlanId = keyof typeof PAID_SUBSCRIPTION_PLANS

export function isPaidSubscriptionPlan(value: string): value is PaidSubscriptionPlanId {
  return Object.prototype.hasOwnProperty.call(PAID_SUBSCRIPTION_PLANS, value)
}
export function getPaidSubscriptionPlan(value: string) {
  if (!isPaidSubscriptionPlan(value)) throw new Error("PAYMENT_PRODUCT_INVALID")
  return PAID_SUBSCRIPTION_PLANS[value]
}

export function millisToTnd(amountMillis: number) {
  return amountMillis / 1_000
}
