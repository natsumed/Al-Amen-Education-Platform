import { getDaysLeft, formatDate } from "@/lib/utils"

const PLAN_LABELS: Record<string, { fr: string; ar: string }> = {
  STUDENT_MONTHLY: { fr: "Mensuel élève", ar: "شهري تلميذ" },
  STUDENT_YEARLY: { fr: "Annuel élève", ar: "سنوي تلميذ" },
  TEACHER_MONTHLY: { fr: "Mensuel enseignant", ar: "شهري معلم" },
  TEACHER_YEARLY: { fr: "Annuel enseignant", ar: "سنوي معلم" },
  FREE: { fr: "Gratuit", ar: "مجاني" },
}

/** Server-authoritative calendar context for the LLM (never invent dates). */
export function getAssistantClock(lang: "fr" | "ar" = "fr") {
  const now = new Date()
  const locale = lang === "ar" ? "ar-TN" : "fr-TN"
  return {
    todayIso: now.toISOString().slice(0, 10),
    todayLabel: new Intl.DateTimeFormat(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Africa/Tunis",
    }).format(now),
    timeZone: "Africa/Tunis",
  }
}

export function formatSubscriptionFacts(
  sub: { plan: string; status: string; startDate: Date; endDate: Date },
  lang: "fr" | "ar" = "fr"
) {
  const locale = lang === "ar" ? "ar-TN" : "fr-TN"
  const daysLeft = getDaysLeft(sub.endDate)
  const planLabel = PLAN_LABELS[sub.plan]?.[lang] || sub.plan
  return {
    plan: sub.plan,
    planLabel,
    status: sub.status,
    startDate: sub.startDate.toISOString(),
    endDate: sub.endDate.toISOString(),
    startDateLabel: formatDate(sub.startDate, locale),
    endDateLabel: formatDate(sub.endDate, locale),
    daysLeft,
    active: daysLeft > 0 && sub.status === "ACTIVE",
  }
}
