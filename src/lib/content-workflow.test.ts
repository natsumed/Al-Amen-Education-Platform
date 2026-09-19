import { describe, expect, it } from "vitest"
import { createContentSchema } from "./validations"

describe("content draft workflow", () => {
  it("accepts a flexible metadata-only draft", () => {
    const result = createContentSchema.safeParse({
      displayTitle: "Conte de Abd",
      primaryLanguage: "AR",
      contentType: "BOOK",
      audience: "LEARNER",
      isFree: true,
      status: "DRAFT",
    })
    expect(result.success).toBe(true)
  })

  it("rejects publication status and invalid zero prices", () => {
    expect(createContentSchema.safeParse({ displayTitle: "Livre", contentType: "BOOK", audience: "LEARNER", status: "PUBLISHED" }).success).toBe(false)
    expect(createContentSchema.safeParse({ displayTitle: "Livre", contentType: "BOOK", audience: "LEARNER", isFree: false, priceMillis: 0 }).success).toBe(false)
  })
})
