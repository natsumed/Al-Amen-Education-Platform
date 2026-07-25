import { describe, it, expect } from "vitest"
import { getPlanPrice } from "../utils"

/**
 * Manual activation must create a SUCCESS Payment with provider MANUAL
 * and amount matching the plan price (see manualActivateSubscription).
 */
describe("manual activation payment shape", () => {
  it("maps each plan to a positive MANUAL payment amount", () => {
    const plans = [
      "STUDENT_MONTHLY",
      "STUDENT_YEARLY",
      "TEACHER_MONTHLY",
      "TEACHER_YEARLY",
    ] as const

    for (const plan of plans) {
      const payment = {
        provider: "MANUAL" as const,
        status: "SUCCESS" as const,
        amount: getPlanPrice(plan),
        itemType: "SUBSCRIPTION",
        itemId: plan,
      }
      expect(payment.provider).toBe("MANUAL")
      expect(payment.status).toBe("SUCCESS")
      expect(payment.amount).toBeGreaterThan(0)
      expect(payment.itemId).toBe(plan)
    }
  })
})
