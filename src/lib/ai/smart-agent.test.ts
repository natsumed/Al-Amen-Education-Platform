import { describe, it, expect } from "vitest"
import {
  normalizeContentSearchFilters,
  filtersFromUserText,
  matchLinkedChild,
  extractChildNameHint,
} from "./content-search-filters"
import { classifyOfflineIntent } from "./smart-offline-agent"
import { buildContentSearchWhere } from "./agent-tools"

describe("normalizeContentSearchFilters", () => {
  it("maps arabe / maths / année 4 / livre synonyms", () => {
    const arabe = normalizeContentSearchFilters({ query: "cours arabes utiles" })
    expect(arabe.subject).toBe("ARABIC")
    expect(arabe.contentType).toBe("COURSE")

    const maths = normalizeContentSearchFilters({ query: "maths 4ème année" })
    expect(maths.subject).toBe("MATH")
    expect(maths.grade).toBe("GRADE_4")

    const book = normalizeContentSearchFilters({ query: "livre français" })
    expect(book.contentType).toBe("BOOK")
    expect(book.subject).toBe("FRENCH")
  })

  it("keeps explicit enums over inferred text", () => {
    const f = normalizeContentSearchFilters({
      query: "arabe",
      subject: "MATH",
      grade: "GRADE_2",
    })
    expect(f.subject).toBe("MATH")
    expect(f.grade).toBe("GRADE_2")
  })

  it("filtersFromUserText infers ARABIC for course questions", () => {
    const f = filtersFromUserText("quels sont les cours arabes utile pour mon enfant")
    expect(f.subject).toBe("ARABIC")
    expect(f.contentType).toBe("COURSE")
  })
})

describe("buildContentSearchWhere with synonyms", () => {
  it("applies subject without requiring leftover text query", () => {
    const where = buildContentSearchWhere({ query: "arabe" })
    expect(where.status).toBe("PUBLISHED")
    expect(where.subject).toBe("ARABIC")
  })

  it("keeps OR when residual keywords remain", () => {
    const where = buildContentSearchWhere({ query: "fractions maths", grade: "GRADE_4" })
    expect(where.grade).toBe("GRADE_4")
    expect(where.subject).toBe("MATH")
    expect(where.OR).toBeDefined()
  })
})

describe("matchLinkedChild / extractChildNameHint", () => {
  const links = [
    {
      linkStatus: "PENDING",
      student: { id: "1", fullName: "Salah Ben Ali", publicId: "10000003", email: "s@x.tn" },
    },
    {
      linkStatus: "ACCEPTED",
      student: { id: "2", fullName: "Amira Trabelsi", publicId: "10000005", email: "a@x.tn" },
    },
  ]

  it("matches by first name preferring ACCEPTED", () => {
    const m = matchLinkedChild(links, "Amira")
    expect(m?.student.id).toBe("2")
  })

  it("matches Salah even if PENDING when only name match", () => {
    const m = matchLinkedChild(links, "Salah")
    expect(m?.student.fullName).toMatch(/Salah/)
  })

  it("extracts child name from French questions", () => {
    expect(extractChildNameHint("quels sont les cours que mon enfant salah a étudié")).toBe(
      "salah"
    )
  })
})

describe("classifyOfflineIntent", () => {
  it("classifies course+enfant as search_content not parent_link", () => {
    expect(
      classifyOfflineIntent("quels sont les cours arabes utile pour mon enfant", "PARENT")
    ).toBe("search_content")
  })

  it("classifies studied courses as child_progress for parents", () => {
    expect(
      classifyOfflineIntent("quels sont les cours que mon enfant salah a étudié", "PARENT")
    ).toBe("child_progress")
  })

  it("classifies pricing", () => {
    expect(classifyOfflineIntent("Quels sont les tarifs ?", "STUDENT")).toBe("pricing")
  })

  it("classifies child subscription days, not pricing", () => {
    expect(
      classifyOfflineIntent(
        "combien de jours restent pour l'abonnement de mon enfant",
        "PARENT"
      )
    ).toBe("child_subscription")
  })

  it("classifies today date questions", () => {
    expect(classifyOfflineIntent("quel est la date d'aujourd'hui?", "PARENT")).toBe("today")
  })

  it("classifies parent link how-to without catalog words", () => {
    expect(classifyOfflineIntent("comment lier mon enfant avec le n° compte ?", "PARENT")).toBe(
      "parent_link_help"
    )
  })
})
