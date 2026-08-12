import type { Language } from "./i18n"

/** Human-readable enum labels mirrored from the web platform (src/types/index.ts). */

export const GRADES = ["", "GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"] as const
export const SUBJECTS = [
  "",
  "ARABIC",
  "FRENCH",
  "MATH",
  "SCIENCE",
  "ISLAMIC",
  "HISTORY",
  "CIVIC",
  "ARTS",
  "ENGLISH",
] as const
export const CONTENT_TYPES = ["", "COURSE", "BOOK", "SERIES", "ANIMATION"] as const

const SUBJECT_LABELS: Record<string, { ar: string; fr: string }> = {
  ARABIC: { ar: "اللغة العربية", fr: "Arabe" },
  FRENCH: { ar: "الفرنسية", fr: "Français" },
  MATH: { ar: "الرياضيات", fr: "Mathématiques" },
  SCIENCE: { ar: "العلوم", fr: "Sciences" },
  ISLAMIC: { ar: "التربية الإسلامية", fr: "Éducation islamique" },
  HISTORY: { ar: "التاريخ والجغرافيا", fr: "Histoire-Géo" },
  CIVIC: { ar: "التربية المدنية", fr: "Éducation civique" },
  ARTS: { ar: "الفنون", fr: "Arts" },
  ENGLISH: { ar: "الإنجليزية", fr: "Anglais" },
}

const CONTENT_TYPE_LABELS: Record<string, { ar: string; fr: string }> = {
  COURSE: { ar: "درس", fr: "Cours" },
  BOOK: { ar: "كتاب", fr: "Livre" },
  SERIES: { ar: "سلسلة", fr: "Série" },
  ANIMATION: { ar: "رسوم متحركة", fr: "Animation" },
}

const SUBJECT_ICON: Record<string, string> = {
  ARABIC: "language",
  FRENCH: "text",
  MATH: "calculator",
  SCIENCE: "flask",
  ISLAMIC: "moon",
  HISTORY: "earth",
  CIVIC: "people",
  ARTS: "color-palette",
  ENGLISH: "chatbubbles",
}

const CONTENT_TYPE_ICON: Record<string, string> = {
  COURSE: "play-circle",
  BOOK: "book",
  SERIES: "albums",
  ANIMATION: "film",
}

export function gradeNumber(grade: string): string {
  return grade.replace("GRADE_", "")
}

export function gradeLabel(grade: string, lang: Language): string {
  const num = gradeNumber(grade)
  return lang === "ar" ? `السنة ${num}` : `Année ${num}`
}

export function gradeShortLabel(grade: string, lang: Language): string {
  const num = gradeNumber(grade)
  return lang === "ar" ? `س${num}` : `A${num}`
}

export function subjectLabel(subject: string, lang: Language): string {
  return SUBJECT_LABELS[subject]?.[lang] ?? subject
}

export function contentTypeLabel(type: string, lang: Language): string {
  return CONTENT_TYPE_LABELS[type]?.[lang] ?? type
}

export function subjectIcon(subject: string): string {
  return SUBJECT_ICON[subject] ?? "book"
}

export function contentTypeIcon(type: string): string {
  return CONTENT_TYPE_ICON[type] ?? "document"
}
