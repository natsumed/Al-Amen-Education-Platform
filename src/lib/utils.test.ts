import { describe, it, expect } from "vitest"
import { getPlanDurationDays, getPlanPrice, calculateSubscriptionEnd } from "./utils"

describe("subscription utils", () => {
  it("returns correct plan durations", () => {
    expect(getPlanDurationDays("STUDENT_MONTHLY")).toBe(30)
    expect(getPlanDurationDays("TEACHER_YEARLY")).toBe(365)
  })

  it("returns correct prices in TND", () => {
    expect(getPlanPrice("STUDENT_MONTHLY")).toBe(15)
    expect(getPlanPrice("TEACHER_YEARLY")).toBe(200)
  })

  it("calculates end date from duration", () => {
    const from = new Date("2026-01-01T00:00:00Z")
    const end = calculateSubscriptionEnd(30, from)
    expect(end.getUTCDate()).toBe(31)
  })
})
