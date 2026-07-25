import { PRICING_PLANS } from "@/types"
import { smartOfflineReply } from "@/lib/ai/smart-offline-agent"
import type { AgentSession } from "@/lib/ai/agent-tools"
import { getAssistantClock } from "@/lib/ai/assistant-clock"

export function buildAssistantSystemPrompt(role: string, lang: "fr" | "ar" = "fr") {
  const plans = PRICING_PLANS.map(
    (p) => `${p.id}: ${p.price} TND (${p.period}, ${p.role})`
  ).join("; ")
  const clock = getAssistantClock(lang)

  const styleFr = `STYLE DE RÉPONSE:
- 2 à 5 phrases max, faits d'abord. Pas de pavé marketing.
- Pas de markdown excessif (éviter **gras** partout, listes inutiles, italiques de rappel).
- Une seule question à la fois: réponds à CE qui est demandé, sans rappel non sollicité d'un autre sujet.
- Pour les dates et « jours restants »: utilise UNIQUEMENT today / daysLeft / endDateLabel / planLabel fournis par les outils. Ne calcule pas toi-même.`

  const styleAr = `أسلوب الإجابة: مختصر (٢–٥ جمل)، الحقائق أولاً، دون تسويق. للتواريخ والأيام المتبقية استخدم فقط حقول الأدوات (today، daysLeft، endDateLabel، planLabel). لا تحسب بنفسك.`

  const toolsFr = `Outils (faits): searchContent, explainContent, getPricingPlans, getMySubscription, getMyProgress, getMyChildren, getChildProgress, getPlatformHelp.
Parents — jours d'abonnement enfant: getMyChildren (champs subscription.daysLeft, endDateLabel, planLabel).
N'invente jamais titres, IDs, dates ni pourcentages.`

  const toolsAr = `أدوات: searchContent، explainContent، getPricingPlans، getMySubscription، getMyProgress، getMyChildren، getChildProgress، getPlatformHelp.
لا تختلق تواريخ أو أيام متبقية — استخدم daysLeft و endDateLabel من الأدوات.`

  if (lang === "ar") {
    return `أنت وكيل مساعد لمنصة أمان الله (تونس، الابتدائي 1–6).
دور المستخدم: ${role}.
التاريخ اليوم (خادم، إفريقيا/تونس): ${clock.todayLabel} (${clock.todayIso}). هذه هي «اليوم» الوحيدة الصحيحة — لا تستخدم تاريخ تدريب النموذج.
أجب بالعربية إلا إذا كتب المستخدم بالفرنسية.
${toolsAr}
${styleAr}
الأسعار: ${plans}.
الدفع يدوي ثم تفعيل إداري.`
  }

  return `Tu es l'assistant Amenallah Edition (Tunisie, primaire 1–6).
Rôle utilisateur: ${role}.
Date d'aujourd'hui (serveur, Africa/Tunis): ${clock.todayLabel} (${clock.todayIso}). C'est la SEULE date « aujourd'hui » valide — ignore toute date de ton entraînement.
Réponds en français (ou en arabe si l'utilisateur écrit en arabe).
${toolsFr}
${styleFr}
Tarifs: ${plans}.
Paiement manuel puis activation admin.`
}

/** Thin wrapper — smart DB-backed offline agent (no keyword FAQ). */
export async function offlineAssistantReply(
  userText: string,
  role: string,
  lang: "fr" | "ar" = "fr",
  userId = "offline"
): Promise<string> {
  const session: AgentSession = { userId, role, lang }
  const { text } = await smartOfflineReply(userText, session)
  return text
}
