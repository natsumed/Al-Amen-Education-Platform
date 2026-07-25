import { describe, it, expect, vi, afterEach } from "vitest"
import { formatSubscriptionFacts, getAssistantClock } from "./assistant-clock"
import { getDaysLeft } from "@/lib/utils"

describe("assistant clock & subscription facts", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("exposes today in Africa/Tunis", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-23T12:00:00+01:00"))
    const clock = getAssistantClock("fr")
    expect(clock.todayIso).toBe("2026-07-23")
    expect(clock.todayLabel.toLowerCase()).toMatch(/juillet|2026/)
  })

  it("computes daysLeft from endDate with getDaysLeft", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-23T12:00:00+01:00"))
    const end = new Date("2026-08-20T00:00:00+01:00")
    expect(getDaysLeft(end)).toBe(28)
    const facts = formatSubscriptionFacts(
      {
        plan: "STUDENT_MONTHLY",
        status: "ACTIVE",
        startDate: new Date("2026-07-20"),
        endDate: end,
      },
      "fr"
    )
    expect(facts.daysLeft).toBe(28)
    expect(facts.planLabel).toMatch(/Mensuel/i)
    expect(facts.endDateLabel).toBeTruthy()
  })
})
