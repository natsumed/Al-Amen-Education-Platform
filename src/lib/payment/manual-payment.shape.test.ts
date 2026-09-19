import { describe, it, expect } from "vitest"
import { getPlanPrice } from "../utils"

describe("payment catalogue shape", () => {
  it("maps each plan to a positive integer amount in millimes", () => {
    const plans = [
      "STUDENT_MONTHLY",
      "STUDENT_YEARLY",
      "TEACHER_MONTHLY",
      "TEACHER_YEARLY",
    ] as const

    for (const plan of plans) {
      const payment = {
        provider: "MANUAL_CASH" as const,
        status: "SUCCEEDED" as const,
        amountMillis: Math.round(getPlanPrice(plan) * 1_000),
        itemType: "SUBSCRIPTION",
        itemId: plan,
      }
      expect(payment.provider).toBe("MANUAL_CASH")
      expect(payment.status).toBe("SUCCEEDED")
      expect(Number.isSafeInteger(payment.amountMillis)).toBe(true)
      expect(payment.amountMillis).toBeGreaterThan(0)
      expect(payment.itemId).toBe(plan)
    }
  })
})
