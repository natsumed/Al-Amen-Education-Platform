import { describe, expect, it } from "vitest"
import { contentProposalSchema } from "./content-ingestion"

describe("contentProposalSchema", () => {
  it("rejects unsupported grades and unbounded confidence", () => {
    const result = contentProposalSchema.safeParse({
      titleAr: "رياضيات",
      titleFr: "Mathématiques",
      descriptionAr: "درس تعليمي",
      descriptionFr: "Cours éducatif",
      grade: "GRADE_9",
      subject: "MATH",
      contentType: "COURSE",
      keywords: [],
      confidence: 2,
      reviewNotes: [],
    })
    expect(result.success).toBe(false)
  })
})
