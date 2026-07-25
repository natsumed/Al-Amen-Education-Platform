import { gradeLabel, subjectLabel, contentTypeLabel } from "@/lib/utils"
import type { Grade, Subject } from "@/types"

/** Deterministic pedagogical hint for agent search results (no extra LLM call). */
export function whyUsefulForContent(input: {
  grade: string
  subject: string
  contentType: string
  isFree: boolean
  lang?: "fr" | "ar"
}): string {
  const lang = input.lang || "fr"
  const grade = gradeLabel(input.grade as Grade, lang)
  const subject = subjectLabel(input.subject as Subject, lang)
  const type = contentTypeLabel(input.contentType, lang)
  const free =
    lang === "ar"
      ? input.isFree
        ? "مجاني"
        : "يتطلب اشتراكاً"
      : input.isFree
        ? "accès libre"
        : "nécessite un abonnement"

  if (lang === "ar") {
    return `مفيد لـ ${grade} في مادة ${subject}. نوعه ${type} (${free}) — مناسب للمراجعة والتعلم حسب البرنامج التونسي.`
  }
  return `Utile pour ${grade}, matière ${subject}. Format ${type} (${free}) — adapté à la révision et au programme tunisien.`
}
