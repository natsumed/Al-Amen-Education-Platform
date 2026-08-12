import type { AgentSession } from "@/lib/ai/agent-tools"
import {
  runSearchContent,
  runGetPricingPlans,
  runGetMySubscription,
  runGetMyProgress,
  runGetMyChildren,
  runGetChildProgress,
} from "@/lib/ai/agent-tools"
import { getPlatformHelpSnippet, type HelpTopic } from "@/lib/ai/platform-help"
import {
  extractChildNameHint,
  filtersFromUserText,
} from "@/lib/ai/content-search-filters"
import { getAssistantClock } from "@/lib/ai/assistant-clock"

export type OfflineIntent =
  | "search_content"
  | "child_progress"
  | "child_subscription"
  | "my_progress"
  | "pricing"
  | "subscription"
  | "today"
  | "parent_link_help"
  | "payment_help"
  | "browse_help"
  | "general"

/** Pure intent classifier — course queries beat generic “enfant” parent-link FAQ. */
export function classifyOfflineIntent(userText: string, role: string): OfflineIntent {
  const q = userText.toLowerCase()

  if (
    /date d'aujourd|aujourd'hui|اليوم|what day|quelle date|اليوم كم/i.test(q) &&
    !/abonnement|اشتراك|cours|درس/.test(q)
  ) {
    return "today"
  }

  const wantsCatalog =
    /\b(cours|livre|contenus?|catalogue|maths?|arabes?|fran[cç]ais|sciences?|chercher|trouve|utile|recommand|درس|دروس|كتاب|محتوى|رياضيات|عربي|فرنسي|ابحث)\b/i.test(
      q
    ) || /année\s*[1-6]|سنة\s*[1-6]/i.test(q)

  const wantsStudiedProgress =
    /étudi[ée]s?|progression|progress\b|suivi|appris|terminé|تقدّم|درسها/i.test(q)

  const wantsChildProgress = role === "PARENT" && wantsStudiedProgress

  const wantsChildSub =
    role === "PARENT" &&
    /abonnement|subscription|jours?\s+rest|reste|expire|fin\s+d|اشتراك|متبقي/i.test(q)

  if (wantsChildSub) return "child_subscription"
  if (wantsChildProgress) return "child_progress"
  if (wantsCatalog) return "search_content"

  // "combien de jours" ≠ pricing; require price words
  if (/\b(prix|tarifs?|price|سعر|أسعار)\b/i.test(q) || /combien\s+(coûte|coute|ça\s+coûte)/i.test(q)) {
    return "pricing"
  }

  if (/\b(abonnement|subscription|اشتراك|actif|expire|jours?\s+rest)\b/i.test(q) && role !== "PARENT") {
    return "subscription"
  }

  if (
    role !== "PARENT" &&
    /\b(ma progression|mes cours|j'ai étudi|تقدم|دوراتي)\b/i.test(q)
  ) {
    return "my_progress"
  }

  if (/\b(paye?r?|paiement|دفع|virement|espèces|نقد|تحويل)\b/i.test(q)) return "payment_help"

  if (
    /\b(lier|lien parent|invit|ربط|ولي أمر|n°\s*compte|numero compte|publicid)\b/i.test(q) ||
    (role === "PARENT" &&
      /\b(enfant|طفل)\b/i.test(q) &&
      /\b(ajouter|comment|كيف|ربط)\b/i.test(q) &&
      !wantsCatalog)
  ) {
    return "parent_link_help"
  }

  if (/\b(comment|how|كيف|aide|help|naviguer|explorer|تصفح)\b/i.test(q)) {
    return "browse_help"
  }

  if (role === "PARENT" && /\b(enfant|enfants|طفل|أبناء)\b/i.test(q)) {
    return "child_progress"
  }

  return "general"
}

function geminiHint(lang: "fr" | "ar") {
  return lang === "ar"
    ? "\n\n— لحوار أكثر طبيعية، أضف GEMINI_API_KEY في .env ثم أعد تشغيل الخادم."
    : "\n\n— Pour un dialogue plus naturel, ajoutez GEMINI_API_KEY dans .env puis redémarrez le serveur."
}

function formatSearchAnswer(
  data: Awaited<ReturnType<typeof runSearchContent>>,
  lang: "fr" | "ar"
): string {
  if (!data.count) {
    return (
      (lang === "ar"
        ? "لم أجد محتويات مطابقة في الكتالوج المنشور. جرّب /content/browse مع تصفية السنة/المادة."
        : "Aucun contenu publié ne correspond. Essayez /content/browse avec les filtres année/matière.") +
      geminiHint(lang)
    )
  }
  const lines = data.items.map((c, i) => {
    const title = lang === "ar" ? c.titleAr || c.titleFr : c.titleFr || c.titleAr
    return `${i + 1}. ${title} (${c.subject}, ${c.grade}, ${c.contentType}${c.isFree ? ", gratuit" : ""}) — ${c.detailPath}\n   ${c.whyUseful}`
  })
  const header =
    lang === "ar"
      ? `وجدت ${data.count} محتوى(ات) مفيدة:`
      : `Voici ${data.count} contenu(s) utile(s) :`
  return `${header}\n\n${lines.join("\n\n")}\n\nCatalogue: ${data.browseHint}${geminiHint(lang)}`
}

function formatProgressList(
  items: {
    titleFr: string
    titleAr: string
    progressPercent: number
    completed: boolean
    detailPath: string
    subject?: string
  }[],
  lang: "fr" | "ar",
  who: string
): string {
  if (!items.length) {
    return lang === "ar"
      ? `لا يوجد تقدم مسجّل لـ ${who} بعد.`
      : `Aucune progression enregistrée pour ${who} pour le moment.`
  }
  const lines = items.map((p, i) => {
    const title = lang === "ar" ? p.titleAr || p.titleFr : p.titleFr || p.titleAr
    const done = p.completed ? (lang === "ar" ? "مكتمل" : "terminé") : `${p.progressPercent}%`
    return `${i + 1}. ${title}${p.subject ? ` (${p.subject})` : ""} — ${done} — ${p.detailPath}`
  })
  const header =
    lang === "ar" ? `ما درسه ${who} مؤخراً:` : `Contenus récemment étudiés par ${who} :`
  return `${header}\n\n${lines.join("\n")}`
}

function formatHelp(
  topic: HelpTopic,
  lang: "fr" | "ar",
  role: string
): string {
  const h = getPlatformHelpSnippet(topic, lang, role)
  return `${h.title}\n${h.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nLiens: ${h.links.join(", ")}${geminiHint(lang)}`
}

export async function smartOfflineReply(
  userText: string,
  session: AgentSession
): Promise<{ text: string; intent: OfflineIntent }> {
  const intent = classifyOfflineIntent(userText, session.role)
  const { lang, role } = session

  switch (intent) {
    case "today": {
      const clock = getAssistantClock(lang)
      return {
        text:
          lang === "ar"
            ? `اليوم هو ${clock.todayLabel} (${clock.todayIso}).`
            : `Aujourd'hui nous sommes le ${clock.todayLabel} (${clock.todayIso}).`,
        intent,
      }
    }

    case "search_content": {
      const filters = filtersFromUserText(userText, 6)
      // Prefer COURSE when user said "cours" but type wasn't stripped oddly
      const data = await runSearchContent(session, {
        query: userText,
        grade: filters.grade,
        subject: filters.subject,
        contentType: filters.contentType,
        limit: 6,
      })
      return { text: formatSearchAnswer(data, lang), intent }
    }

    case "child_subscription": {
      const hint = extractChildNameHint(userText)
      const kids = await runGetMyChildren(session)
      if ("error" in kids && kids.error) {
        return { text: String(kids.error), intent }
      }
      if (!("links" in kids) || !kids.links?.length) {
        return {
          text:
            lang === "ar"
              ? "لا يوجد أبناء مرتبطون. ادعُ من «أطفالي»."
              : "Aucun enfant lié. Invitez depuis « Mes enfants ».",
          intent,
        }
      }
      const accepted = kids.links.filter((l) => l.status === "ACCEPTED")
      const pool = accepted.length ? accepted : kids.links
      let pick = pool[0]
      if (hint) {
        const h = hint.toLowerCase()
        pick =
          pool.find((l) => l.student.fullName.toLowerCase().includes(h)) || pick
      }
      const sub = pick.student.subscription
      if (!sub) {
        return {
          text:
            lang === "ar"
              ? `لا اشتراك نشط لـ ${pick.student.fullName}.`
              : `Pas d'abonnement actif pour ${pick.student.fullName}.`,
          intent,
        }
      }
      return {
        text:
          lang === "ar"
            ? `${pick.student.fullName}: ${sub.planLabel}، ينتهي ${sub.endDateLabel} — متبقي ${sub.daysLeft} يوماً.`
            : `${pick.student.fullName}: formule ${sub.planLabel}, expire le ${sub.endDateLabel} — ${sub.daysLeft} jour(s) restant(s).`,
        intent,
      }
    }

    case "child_progress": {
      const hint = extractChildNameHint(userText)
      const data = await runGetChildProgress(session, { childHint: hint, limit: 15 })
      if ("error" in data && data.error) {
        const kids = await runGetMyChildren(session)
        if ("links" in kids && kids.links?.length) {
          const list = kids.links
            .map(
              (l) =>
                `- ${l.student.fullName} (${l.status}${l.student.publicId ? `, n° ${l.student.publicId}` : ""})`
            )
            .join("\n")
          return {
            text:
              `${data.error}\n\n` +
              (lang === "ar" ? "الأبناء المرتبطون:\n" : "Enfants liés :\n") +
              list +
              `\n${kids.childrenPage}` +
              geminiHint(lang),
            intent,
          }
        }
        return { text: String(data.error) + geminiHint(lang), intent }
      }
      if (!("items" in data) || !data.child) {
        return {
          text:
            (lang === "ar" ? "تعذّر قراءة التقدم." : "Impossible de lire la progression.") +
            geminiHint(lang),
          intent,
        }
      }
      let text = formatProgressList(data.items, lang, data.child.fullName)
      text += `\n\n${lang === "ar" ? "التفاصيل:" : "Détails:"} ${data.childPage}`
      // If also asking for recommendations (arabe/cours utiles), append search
      if (/\b(utile|recommand|arabe|math|cours|مفيد|عربي)\b/i.test(userText)) {
        const search = await runSearchContent(session, {
          query: userText,
          limit: 4,
        })
        if (search.count) {
          text +=
            "\n\n" +
            (lang === "ar" ? "اقتراحات من الكتالوج:\n" : "Suggestions du catalogue :\n") +
            search.items
              .map((c) => {
                const title = lang === "ar" ? c.titleAr || c.titleFr : c.titleFr
                return `• ${title} — ${c.detailPath}`
              })
              .join("\n")
        }
      }
      return { text: text + geminiHint(lang), intent }
    }

    case "my_progress": {
      const data = await runGetMyProgress(session)
      if ("error" in data && data.error) {
        return { text: String(data.error) + geminiHint(lang), intent }
      }
      if (!("items" in data)) {
        return { text: geminiHint(lang).trim(), intent }
      }
      return {
        text:
          formatProgressList(data.items || [], lang, lang === "ar" ? "أنت" : "vous") +
          `\n\n${data.progressPage}` +
          geminiHint(lang),
        intent,
      }
    }

    case "pricing": {
      const data = await runGetPricingPlans(session)
      const lines = data.plans.map(
        (p) => `• ${p.id}: ${p.priceTnd} TND (${p.period}) — ${p.checkoutPath}`
      )
      return {
        text:
          (lang === "ar" ? "الأسعار:\n" : "Tarifs :\n") +
          lines.join("\n") +
          `\n${data.note}\n${data.pricingPage}` +
          geminiHint(lang),
        intent,
      }
    }

    case "subscription": {
      const data = await runGetMySubscription(session)
      if ("error" in data && data.error) {
        return { text: String(data.error) + geminiHint(lang), intent }
      }
      if ("active" in data && !data.active) {
        return {
          text: `${data.message} → ${data.pricingPath}` + geminiHint(lang),
          intent,
        }
      }
      if ("daysLeft" in data && "planLabel" in data) {
        return {
          text:
            (lang === "ar"
              ? `اشتراكك (${data.planLabel}) ينتهي ${data.endDateLabel} — متبقي ${data.daysLeft} يوماً.`
              : `Votre abonnement (${data.planLabel}) expire le ${data.endDateLabel} — ${data.daysLeft} jour(s) restant(s).`) +
            `\n${data.subscriptionPage}`,
          intent,
        }
      }
      return { text: formatHelp("subscription", lang, role), intent }
    }

    case "parent_link_help":
      return { text: formatHelp("parent_link", lang, role), intent }
    case "payment_help":
      return { text: formatHelp("payment", lang, role), intent }
    case "browse_help":
      return { text: formatHelp("browse", lang, role), intent }
    default: {
      // Default: try a light catalog search if the message looks educational
      if (userText.length > 8) {
        const data = await runSearchContent(session, { query: userText, limit: 4 })
        if (data.count > 0) {
          return { text: formatSearchAnswer(data, lang), intent: "search_content" }
        }
      }
      return {
        text: formatHelp("general", lang, role),
        intent: "general",
      }
    }
  }
}
