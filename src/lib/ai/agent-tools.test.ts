import { describe, it, expect } from "vitest"
import {
  buildContentSearchWhere,
  canUseParentTools,
  canUseSubscriptionTools,
  mapPricingPlansForAgent,
} from "./agent-tools"
import { getPlatformHelpSnippet } from "./platform-help"

describe("agent tool helpers", () => {
  it("builds content search where with synonym subject and optional OR", () => {
    const where = buildContentSearchWhere({ query: "fractions", grade: "GRADE_4" })
    expect(where.status).toBe("PUBLISHED")
    expect(where.grade).toBe("GRADE_4")
    expect(where.OR).toHaveLength(4)
  })

  it("infers MATH from maths keyword", () => {
    const where = buildContentSearchWhere({ query: "maths", grade: "GRADE_4" })
    expect(where.subject).toBe("MATH")
    expect(where.grade).toBe("GRADE_4")
  })

  it("maps all pricing plans with checkout paths", () => {
    const plans = mapPricingPlansForAgent()
    expect(plans).toHaveLength(4)
    expect(plans.every((p) => p.checkoutPath.startsWith("/checkout?plan="))).toBe(true)
    expect(plans.find((p) => p.id === "STUDENT_MONTHLY")?.priceTnd).toBe(15)
  })

  it("gates parent and subscription tools by role", () => {
    expect(canUseParentTools("PARENT")).toBe(true)
    expect(canUseParentTools("STUDENT")).toBe(false)
    expect(canUseSubscriptionTools("TEACHER")).toBe(true)
    expect(canUseSubscriptionTools("PARENT")).toBe(false)
  })

  it("returns platform help snippets with links", () => {
    const help = getPlatformHelpSnippet("payment", "fr", "STUDENT")
    expect(help.title).toMatch(/Paiement/i)
    expect(help.links).toContain("/pricing")
    const ar = getPlatformHelpSnippet("parent_link", "ar", "PARENT")
    expect(ar.links).toContain("/parent/children")
  })
})
