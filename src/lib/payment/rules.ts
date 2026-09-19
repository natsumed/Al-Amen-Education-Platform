import type { GatewayPaymentStatus } from "./types"

export type PaymentVerificationSnapshot = {
  merchantOrderRef: string
  providerOrderRef: string | null
  amountMillis: number
  currency: string
}

export function paymentVerificationMatches(
  payment: PaymentVerificationSnapshot,
  verified: GatewayPaymentStatus
) {
  if (verified.merchantOrderRef !== payment.merchantOrderRef) return false
  if (payment.providerOrderRef != null && verified.providerOrderRef !== payment.providerOrderRef) return false
  if (verified.amountMillis == null || verified.amountMillis !== payment.amountMillis) return false
  if (verified.currency == null || verified.currency !== payment.currency) return false
  return true
}

export function nextSubscriptionWindow(input: {
  now: Date
  latestGrantEndsAt?: Date | null
  currentSubscriptionEndsAt?: Date | null
  durationDays: number
}) {
  const startsAt = new Date(Math.max(
    input.now.getTime(),
    input.latestGrantEndsAt?.getTime() || 0,
    input.currentSubscriptionEndsAt?.getTime() || 0
  ))
  const endsAt = new Date(startsAt.getTime() + input.durationDays * 86_400_000)
  return { startsAt, endsAt }
}
