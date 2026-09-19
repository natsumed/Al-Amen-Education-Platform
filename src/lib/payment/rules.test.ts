import { describe, expect, it } from "vitest"
import { nextSubscriptionWindow, paymentVerificationMatches } from "./rules"

describe("payment verification", () => {
  const payment = {
    merchantOrderRef: "AMEN-ORDER-1",
    providerOrderRef: "SMT-1",
    amountMillis: 15_000,
    currency: "TND",
  }

  it("accepts an exact authoritative match", () => {
    expect(paymentVerificationMatches(payment, {
      ...payment,
      providerTransactionRef: "TX-1",
      status: "SUCCEEDED",
      verified: true,
    })).toBe(true)
  })

  it.each([
    { merchantOrderRef: "OTHER" },
    { providerOrderRef: "OTHER" },
    { amountMillis: 14_999 },
    { currency: "EUR" },
    { amountMillis: undefined },
    { currency: undefined },
  ])("rejects mismatched payment data: %o", (change) => {
    expect(paymentVerificationMatches(payment, {
      ...payment,
      ...change,
      status: "SUCCEEDED",
      verified: true,
    })).toBe(false)
  })
})

describe("subscription grant scheduling", () => {
  it("starts a new subscription immediately when no paid time remains", () => {
    const now = new Date("2026-09-18T12:00:00.000Z")
    const result = nextSubscriptionWindow({ now, durationDays: 30 })
    expect(result.startsAt).toEqual(now)
    expect(result.endsAt).toEqual(new Date("2026-10-18T12:00:00.000Z"))
  })

  it("preserves remaining paid time on renewal", () => {
    const result = nextSubscriptionWindow({
      now: new Date("2026-09-18T12:00:00.000Z"),
      currentSubscriptionEndsAt: new Date("2026-10-01T12:00:00.000Z"),
      latestGrantEndsAt: new Date("2026-10-03T12:00:00.000Z"),
      durationDays: 30,
    })
    expect(result.startsAt).toEqual(new Date("2026-10-03T12:00:00.000Z"))
    expect(result.endsAt).toEqual(new Date("2026-11-02T12:00:00.000Z"))
  })
})
