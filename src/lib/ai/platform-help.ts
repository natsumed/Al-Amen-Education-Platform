export type HelpTopic = "browse" | "payment" | "subscription" | "parent_link" | "general"

export function getPlatformHelpSnippet(
  topic: HelpTopic,
  lang: "fr" | "ar",
  role: string
) {
  const fr: Record<HelpTopic, { title: string; steps: string[]; links: string[] }> = {
    browse: {
      title: "Explorer le catalogue",
      steps: [
        "Ouvrez Explorer / Contenu depuis le menu.",
        "Filtrez par année, matière ou type (cours, livre, série, animation).",
        "Certains contenus sont gratuits; le reste nécessite un abonnement actif.",
      ],
      links: ["/content/browse"],
    },
    payment: {
      title: "Paiement manuel",
      steps: [
        "Choisissez un plan sur /pricing puis créez une demande de paiement.",
        "Payez en espèces ou par virement selon les instructions de l'admin.",
        "L'administrateur approuve la demande pour activer la période d'abonnement.",
      ],
      links: ["/pricing", role === "PARENT" ? "/parent/pay" : "/checkout"],
    },
    subscription: {
      title: "Abonnement",
      steps: [
        "Consultez Mon abonnement pour les dates de début et de fin.",
        "Plans élève: 15 TND/mois ou 120 TND/an. Enseignant: 25 TND/mois ou 200 TND/an.",
        "Après expiration, le contenu premium se verrouille jusqu'à renouvellement.",
      ],
      links: [
        "/pricing",
        role === "TEACHER" ? "/teacher/subscription" : "/student/subscription",
      ],
    },
    parent_link: {
      title: "Liaison parent–élève",
      steps: [
        "Le parent n'accède pas aux cours directement.",
        "Une invitation parent–élève doit être acceptée.",
        "Ensuite le parent peut payer pour l'enfant et suivre la progression.",
      ],
      links: ["/parent/children", "/parent/pay"],
    },
    general: {
      title: "Aide Amenallah",
      steps: [
        "Plateforme éducative tunisienne pour le primaire (années 1–6).",
        "Rôles: élève, enseignant, parent (suivi/paiement).",
        "Utilisez les outils de recherche et de tarifs pour des réponses à jour.",
      ],
      links: ["/", "/pricing", "/content/browse"],
    },
  }

  const ar: Record<HelpTopic, { title: string; steps: string[]; links: string[] }> = {
    browse: {
      title: "تصفح المحتوى",
      steps: [
        "افتح الاستكشاف/المحتوى من القائمة.",
        "صفِّ حسب السنة أو المادة أو النوع.",
        "بعض المحتويات مجانية؛ الباقي يحتاج اشتراكاً نشطاً.",
      ],
      links: ["/content/browse"],
    },
    payment: {
      title: "الدفع اليدوي",
      steps: [
        "اختر خطة من /pricing ثم أنشئ طلب دفع.",
        "ادفع نقداً أو تحويلاً حسب تعليمات الإدارة.",
        "يوافق المدير لتفعيل فترة الاشتراك.",
      ],
      links: ["/pricing", role === "PARENT" ? "/parent/pay" : "/checkout"],
    },
    subscription: {
      title: "الاشتراك",
      steps: [
        "راجع «اشتراكي» لمعرفة تاريخ البداية والنهاية.",
        "تلميذ: 15 د/شهر أو 120 د/سنة. معلم: 25 د/شهر أو 200 د/سنة.",
        "بعد الانتهاء يُقفل المحتوى المميز حتى التجديد.",
      ],
      links: [
        "/pricing",
        role === "TEACHER" ? "/teacher/subscription" : "/student/subscription",
      ],
    },
    parent_link: {
      title: "ربط ولي الأمر بالتلميذ",
      steps: [
        "ولي الأمر لا يدخل الدروس مباشرة.",
        "يجب قبول دعوة الربط بين الولي والتلميذ.",
        "بعدها يمكنه الدفع ومتابعة التقدم.",
      ],
      links: ["/parent/children", "/parent/pay"],
    },
    general: {
      title: "مساعدة أمان الله",
      steps: [
        "منصة تعليمية تونسية للمرحلة الابتدائية (1–6).",
        "الأدوار: تلميذ، معلم، ولي أمر (متابعة/دفع).",
        "استخدم أدوات البحث والأسعار لإجابات محدّثة.",
      ],
      links: ["/", "/pricing", "/content/browse"],
    },
  }

  return lang === "ar" ? ar[topic] : fr[topic]
}
