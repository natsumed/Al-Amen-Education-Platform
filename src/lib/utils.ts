import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Grade, Subject } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "TND"): string {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, locale = "fr-TN"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateFull(date: Date | string, locale = "fr-TN"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function getDaysLeft(endDate: Date | string): number {
  const end = new Date(endDate)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function gradeLabel(grade: Grade, lang: "ar" | "fr" = "fr"): string {
  const num = grade.split("_")[1]
  if (lang === "ar") return `السنة ${num}`
  return `Année ${num}`
}

export function subjectLabel(subject: Subject, lang: "ar" | "fr" = "fr"): string {
  const labels: Record<Subject, { ar: string; fr: string }> = {
    ARABIC: { ar: "اللغة العربية", fr: "Arabe" },
    FRENCH: { ar: "الفرنسية", fr: "Français" },
    MATH: { ar: "الرياضيات", fr: "Mathématiques" },
    SCIENCE: { ar: "العلوم", fr: "Sciences" },
    ISLAMIC: { ar: "التربية الإسلامية", fr: "Éducation islamique" },
    HISTORY: { ar: "التاريخ والجغرافيا", fr: "Histoire-Géo" },
    CIVIC: { ar: "التربية المدنية", fr: "Éd. civique" },
    ARTS: { ar: "الفنون", fr: "Arts" },
    ENGLISH: { ar: "الإنجليزية", fr: "Anglais" },
  }
  return labels[subject][lang]
}

export function contentTypeLabel(type: string, lang: "ar" | "fr" = "fr"): string {
  const labels: Record<string, { ar: string; fr: string }> = {
    COURSE: { ar: "درس", fr: "Cours" },
    BOOK: { ar: "كتاب", fr: "Livre" },
    SERIES: { ar: "سلسلة", fr: "Série" },
    ANIMATION: { ar: "تحريك", fr: "Animation" },
  }
  return labels[type]?.[lang] ?? type
}

export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url)
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "…"
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function calculateSubscriptionEnd(
  durationDays: number,
  from = new Date()
): Date {
  const end = new Date(from)
  end.setDate(end.getDate() + durationDays)
  return end
}

export function getPlanDurationDays(plan: string): number {
  switch (plan) {
    case "STUDENT_MONTHLY":
    case "TEACHER_MONTHLY":
      return 30
    case "STUDENT_YEARLY":
    case "TEACHER_YEARLY":
      return 365
    default:
      return 30
  }
}

export function getPlanPrice(plan: string): number {
  switch (plan) {
    case "STUDENT_MONTHLY": return 15
    case "STUDENT_YEARLY": return 120
    case "TEACHER_MONTHLY": return 25
    case "TEACHER_YEARLY": return 200
    default: return 0
  }
}
