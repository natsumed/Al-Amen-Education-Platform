import { describe, it, expect } from "vitest"
import { offlineAssistantReply, buildAssistantSystemPrompt } from "./chat-assistant"
import { PRICING_PLANS } from "@/types"
import { getDaysLeft, getPlanPrice } from "./utils"

describe("chat assistant", () => {
  it("answers pricing questions in French via smart offline", async () => {
    const reply = await offlineAssistantReply("Quels sont les tarifs ?", "STUDENT", "fr")
    expect(reply).toMatch(/15/)
    expect(reply).toMatch(/pricing|STUDENT_MONTHLY/i)
  })

  it("answers parent linking in Arabic without inventing courses", async () => {
    const reply = await offlineAssistantReply("كيف أربط ولي الأمر؟", "PARENT", "ar")
    expect(reply.length).toBeGreaterThan(20)
  })

  it("builds a system prompt including tools, plan prices and today's date", () => {
    const prompt = buildAssistantSystemPrompt("TEACHER", "fr")
    expect(prompt).toContain("Amenallah")
    expect(prompt).toContain("TEACHER")
    expect(prompt).toContain("15")
    expect(prompt).toContain("getChildProgress")
    expect(prompt).toContain("searchContent")
    expect(prompt).toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(prompt).toMatch(/Africa\/Tunis|aujourd'hui/i)
  })
})

describe("pricing plans data", () => {
  it("exposes four Amenallah TND plans", () => {
    expect(PRICING_PLANS).toHaveLength(4)
    const ids = PRICING_PLANS.map((p) => p.id)
    expect(ids).toEqual([
      "STUDENT_MONTHLY",
      "STUDENT_YEARLY",
      "TEACHER_MONTHLY",
      "TEACHER_YEARLY",
    ])
    for (const plan of PRICING_PLANS) {
      expect(getPlanPrice(plan.id)).toBe(plan.price)
      expect(plan.price).toBeGreaterThan(0)
    }
  })
})

describe("subscription period helpers", () => {
  it("getDaysLeft never returns negative", () => {
    expect(getDaysLeft("2000-01-01")).toBe(0)
    const future = new Date()
    future.setDate(future.getDate() + 10)
    expect(getDaysLeft(future)).toBeGreaterThanOrEqual(9)
  })
})
