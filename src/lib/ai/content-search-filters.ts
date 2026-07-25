export type GradeEnum =
  | "GRADE_1"
  | "GRADE_2"
  | "GRADE_3"
  | "GRADE_4"
  | "GRADE_5"
  | "GRADE_6"

export type SubjectEnum =
  | "ARABIC"
  | "FRENCH"
  | "MATH"
  | "SCIENCE"
  | "ISLAMIC"
  | "HISTORY"
  | "CIVIC"
  | "ARTS"
  | "ENGLISH"

export type ContentTypeEnum = "COURSE" | "BOOK" | "SERIES" | "ANIMATION"

export type ContentSearchFilters = {
  query?: string
  grade?: GradeEnum
  subject?: SubjectEnum
  contentType?: ContentTypeEnum
  limit?: number
}

const SUBJECT_PATTERNS: { subject: SubjectEnum; re: RegExp }[] = [
  { subject: "ARABIC", re: /\b(arabes?|arabic|عربي|العربية|عربية)\b/i },
  { subject: "FRENCH", re: /\b(fran[cç]ais|french|فرنسي|الفرنسية)\b/i },
  { subject: "MATH", re: /\b(maths?|mathématiques?|رياضيات|حساب)\b/i },
  { subject: "SCIENCE", re: /\b(sciences?|إيقاظ|علوم)\b/i },
  { subject: "ISLAMIC", re: /\b(islamique|islamic|تربية\s*اسلامية|إسلامية)\b/i },
  { subject: "HISTORY", re: /\b(histoire|history|تاريخ)\b/i },
  { subject: "CIVIC", re: /\b(civique|civic|تربية\s*مدنية|مدنية)\b/i },
  { subject: "ARTS", re: /\b(arts?|رسم|فنون)\b/i },
  { subject: "ENGLISH", re: /\b(anglais|english|إنجليزي|انجليزي)\b/i },
]

const TYPE_PATTERNS: { contentType: ContentTypeEnum; re: RegExp }[] = [
  { contentType: "BOOK", re: /\b(livre|book|كتاب|كتب)\b/i },
  { contentType: "SERIES", re: /\b(série|series|سلسلة)\b/i },
  { contentType: "ANIMATION", re: /\b(animation|animé|متحرك|كرتون)\b/i },
  { contentType: "COURSE", re: /\b(cours|course|درس|دروس|leçon)\b/i },
]

const GRADE_PATTERNS: { grade: GradeEnum; re: RegExp }[] = [
  { grade: "GRADE_1", re: /\b(1(?:ère|ere|er)?\s*année|année\s*1|grade\s*1|سنة\s*1|الأولى)\b/i },
  { grade: "GRADE_2", re: /\b(2(?:ème|eme)?\s*année|année\s*2|grade\s*2|سنة\s*2|الثانية)\b/i },
  { grade: "GRADE_3", re: /\b(3(?:ème|eme)?\s*année|année\s*3|grade\s*3|سنة\s*3|الثالثة)\b/i },
  { grade: "GRADE_4", re: /\b(4(?:ème|eme)?\s*année|année\s*4|grade\s*4|سنة\s*4|الرابعة)\b/i },
  { grade: "GRADE_5", re: /\b(5(?:ème|eme)?\s*année|année\s*5|grade\s*5|سنة\s*5|الخامسة)\b/i },
  { grade: "GRADE_6", re: /\b(6(?:ème|eme)?\s*année|année\s*6|grade\s*6|سنة\s*6|السادسة)\b/i },
]

const STOP_WORDS =
  /\b(les?|des?|une?|du|de|la|le|mon|ma|mes|pour|avec|dans|sur|que|qui|sont|est|cours|livre|utile|utiles|cherche|cherches?|trouver|contenu|contenus|recommandés?|ال|في|من|إلى|على|عن|ما|هي|هو|درس|دروس|كتاب|مفيد|ابحث)\b/gi

/**
 * Map free-text / partial tool args into Prisma-ready filters.
 * Explicit grade/subject/contentType win over inferred synonyms from query.
 */
export function normalizeContentSearchFilters(input: {
  query?: string
  grade?: string
  subject?: string
  contentType?: string
  limit?: number
}): ContentSearchFilters {
  const rawQuery = (input.query || "").trim()
  const text = rawQuery

  let subject = (input.subject as SubjectEnum | undefined) || undefined
  let grade = (input.grade as GradeEnum | undefined) || undefined
  let contentType = (input.contentType as ContentTypeEnum | undefined) || undefined

  if (!subject) {
    for (const p of SUBJECT_PATTERNS) {
      if (p.re.test(text)) {
        subject = p.subject
        break
      }
    }
  }
  if (!grade) {
    for (const p of GRADE_PATTERNS) {
      if (p.re.test(text)) {
        grade = p.grade
        break
      }
    }
  }
  if (!contentType) {
    for (const p of TYPE_PATTERNS) {
      if (p.re.test(text)) {
        contentType = p.contentType
        break
      }
    }
  }

  // Strip known filter tokens so title search stays useful
  let query = rawQuery
  for (const p of [...SUBJECT_PATTERNS, ...GRADE_PATTERNS, ...TYPE_PATTERNS]) {
    query = query.replace(p.re, " ")
  }
  query = query.replace(STOP_WORDS, " ").replace(/\s+/g, " ").trim()
  const textQuery = query.length >= 2 ? query : undefined

  const limit = Math.min(10, Math.max(1, input.limit ?? 5))

  return {
    ...(textQuery ? { query: textQuery } : {}),
    ...(grade ? { grade } : {}),
    ...(subject ? { subject } : {}),
    ...(contentType ? { contentType } : {}),
    limit,
  }
}

/** Infer filters from a full user utterance (offline agent). */
export function filtersFromUserText(userText: string, limit = 5): ContentSearchFilters {
  return normalizeContentSearchFilters({ query: userText, limit })
}

export type LinkedChildCandidate = {
  linkStatus: string
  student: {
    id: string
    fullName: string
    publicId: string | null
    email: string
  }
}

/**
 * Match a linked child by name fragment, publicId, or email.
 * When a hint is given, search all links (prefer ACCEPTED on score ties).
 * Without hint, return the single ACCEPTED child if exactly one, else null.
 */
export function matchLinkedChild(
  links: LinkedChildCandidate[],
  hint?: string
): LinkedChildCandidate | null {
  if (!links.length) return null
  const accepted = links.filter((l) => l.linkStatus === "ACCEPTED")

  if (!hint?.trim()) {
    const pool = accepted.length ? accepted : links
    return pool.length === 1 ? pool[0] : null
  }

  const h = hint.trim().toLowerCase()
  const scored = links
    .map((l) => {
      const name = l.student.fullName.toLowerCase()
      const email = l.student.email.toLowerCase()
      const pid = (l.student.publicId || "").toLowerCase()
      let score = 0
      if (name === h || email === h || pid === h) score = 100
      else if (name.includes(h) || h.split(/\s+/).some((w) => w.length > 2 && name.includes(w)))
        score = 50
      else if (email.includes(h) || pid === h) score = 40
      if (score > 0 && l.linkStatus === "ACCEPTED") score += 5
      return { l, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored[0]?.l ?? null
}

/** Extract a likely child name from FR/AR parent questions. */
export function extractChildNameHint(userText: string): string | undefined {
  const t = userText.trim()
  const patterns = [
    /enfant\s+([A-Za-zÀ-ÿ'\-]+)/i,
    /fils\s+([A-Za-zÀ-ÿ'\-]+)/i,
    /fille\s+([A-Za-zÀ-ÿ'\-]+)/i,
    /(?:ابن|ابنتي|ابني|طفلي|طفلتي)\s+([^\s؟?]+)/i,
    /([A-Za-zÀ-ÿ'\-]{3,})\s+a\s+étudi/i,
    /progression\s+(?:de|d')\s*([A-Za-zÀ-ÿ'\-]+)/i,
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) return m[1]
  }
  return undefined
}
