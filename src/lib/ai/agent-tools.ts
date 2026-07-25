import { z } from "zod"
import { tool } from "ai"
import { prisma } from "@/lib/prisma"
import { PRICING_PLANS } from "@/types"
import { getPlatformHelpSnippet } from "@/lib/ai/platform-help"
import { whyUsefulForContent } from "@/lib/ai/content-hints"
import {
  normalizeContentSearchFilters,
  matchLinkedChild,
  type LinkedChildCandidate,
} from "@/lib/ai/content-search-filters"
import { formatSubscriptionFacts, getAssistantClock } from "@/lib/ai/assistant-clock"

export type AgentSession = {
  userId: string
  role: string
  lang: "fr" | "ar"
}

export function buildContentSearchWhere(input: {
  query?: string
  grade?: string
  subject?: string
  contentType?: string
}) {
  const filters = normalizeContentSearchFilters(input)
  const { query, grade, subject, contentType } = filters
  return {
    status: "PUBLISHED" as const,
    ...(grade ? { grade } : {}),
    ...(subject ? { subject } : {}),
    ...(contentType ? { contentType } : {}),
    ...(query
      ? {
          OR: [
            { titleFr: { contains: query } },
            { titleAr: { contains: query } },
            { descriptionFr: { contains: query } },
            { descriptionAr: { contains: query } },
          ],
        }
      : {}),
  }
}

export function mapPricingPlansForAgent() {
  return PRICING_PLANS.map((p) => ({
    id: p.id,
    role: p.role,
    period: p.period,
    priceTnd: p.price,
    popular: Boolean(p.popular),
    features: p.features,
    checkoutPath: `/checkout?plan=${p.id}`,
  }))
}

export function canUseParentTools(role: string) {
  return role === "PARENT"
}

export function canUseSubscriptionTools(role: string) {
  return role === "STUDENT" || role === "TEACHER"
}

function mapContentItem(
  c: {
    id: string
    titleFr: string
    titleAr: string
    grade: string
    subject: string
    contentType: string
    isFree: boolean
    descriptionFr: string | null
    descriptionAr: string | null
  },
  lang: "fr" | "ar"
) {
  return {
    id: c.id,
    titleFr: c.titleFr,
    titleAr: c.titleAr,
    grade: c.grade,
    subject: c.subject,
    contentType: c.contentType,
    isFree: c.isFree,
    detailPath: `/content/${c.id}`,
    whyUseful: whyUsefulForContent({
      grade: c.grade,
      subject: c.subject,
      contentType: c.contentType,
      isFree: c.isFree,
      lang,
    }),
    summary:
      lang === "ar"
        ? (c.descriptionAr || c.descriptionFr || "").slice(0, 160)
        : (c.descriptionFr || c.descriptionAr || "").slice(0, 160),
  }
}

export async function runSearchContent(
  session: AgentSession,
  input: {
    query?: string
    grade?: string
    subject?: string
    contentType?: string
    limit?: number
  }
) {
  const filters = normalizeContentSearchFilters(input)
  const items = await prisma.content.findMany({
    where: buildContentSearchWhere(input),
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 5,
    select: {
      id: true,
      titleFr: true,
      titleAr: true,
      grade: true,
      subject: true,
      contentType: true,
      isFree: true,
      descriptionFr: true,
      descriptionAr: true,
    },
  })
  return {
    filtersApplied: {
      query: filters.query ?? null,
      grade: filters.grade ?? null,
      subject: filters.subject ?? null,
      contentType: filters.contentType ?? null,
    },
    count: items.length,
    browseHint: "/content/browse",
    items: items.map((c) => mapContentItem(c, session.lang)),
  }
}

export async function runExplainContent(session: AgentSession, contentId: string) {
  const c = await prisma.content.findFirst({
    where: { id: contentId, status: "PUBLISHED" },
    select: {
      id: true,
      titleFr: true,
      titleAr: true,
      grade: true,
      subject: true,
      contentType: true,
      isFree: true,
      descriptionFr: true,
      descriptionAr: true,
    },
  })
  if (!c) {
    return {
      error:
        session.lang === "ar"
          ? "المحتوى غير موجود أو غير منشور."
          : "Contenu introuvable ou non publié.",
    }
  }
  return {
    ...mapContentItem(c, session.lang),
    description:
      session.lang === "ar"
        ? c.descriptionAr || c.descriptionFr
        : c.descriptionFr || c.descriptionAr,
    advice:
      session.lang === "ar"
        ? "اقترح خطوات عملية: افتح الصفحة، راجع الملخص، ثم أكمل التمارين إن وُجدت."
        : "Suggérez des étapes concrètes: ouvrir la fiche, lire le résumé, puis faire les exercices si disponibles.",
  }
}

export async function runGetPricingPlans(session: AgentSession) {
  return {
    currency: "TND",
    pricingPage: "/pricing",
    plans: mapPricingPlansForAgent(),
    note:
      session.lang === "ar"
        ? "الدفع حالياً يدوي (نقداً/تحويل) ثم تفعيل من الإدارة."
        : "Paiement actuellement manuel (espèces/virement) puis activation admin.",
  }
}

export async function runGetMySubscription(session: AgentSession) {
  if (!canUseSubscriptionTools(session.role)) {
    return {
      error:
        session.lang === "ar"
          ? "هذا الأداة للتلاميذ والمعلمين فقط. الأولياء يستخدمون getMyChildren."
          : "Réservé aux élèves/enseignants. Les parents utilisent getMyChildren.",
    }
  }
  const sub = await prisma.subscription.findFirst({
    where: { userId: session.userId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { plan: true, status: true, startDate: true, endDate: true },
  })
  if (!sub) {
    return {
      active: false,
      pricingPath: "/pricing",
      today: getAssistantClock(session.lang),
      message:
        session.lang === "ar" ? "لا يوجد اشتراك نشط." : "Aucun abonnement actif.",
    }
  }
  const facts = formatSubscriptionFacts(sub, session.lang)
  return {
    ...facts,
    today: getAssistantClock(session.lang),
    subscriptionPage:
      session.role === "TEACHER" ? "/teacher/subscription" : "/student/subscription",
  }
}

async function loadParentLinks(parentId: string) {
  return prisma.parentLink.findMany({
    where: { parentId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          publicId: true,
          email: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { plan: true, startDate: true, endDate: true, status: true },
          },
          progress: {
            orderBy: { lastAccessed: "desc" },
            take: 3,
            select: {
              progressPercent: true,
              completed: true,
              content: {
                select: { id: true, titleFr: true, titleAr: true, subject: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function runGetMyChildren(session: AgentSession) {
  if (!canUseParentTools(session.role)) {
    return {
      error:
        session.lang === "ar"
          ? "هذه الأداة لأولياء الأمور فقط."
          : "Cet outil est réservé aux parents.",
    }
  }
  const links = await loadParentLinks(session.userId)
  const today = getAssistantClock(session.lang)
  return {
    today,
    childrenPage: "/parent/children",
    payPage: "/parent/pay",
    links: links.map((l) => ({
      status: l.status,
      student: {
        id: l.student.id,
        fullName: l.student.fullName,
        publicId: l.student.publicId,
        email: l.student.email,
        subscription: l.student.subscriptions[0]
          ? formatSubscriptionFacts(l.student.subscriptions[0], session.lang)
          : null,
        recentProgress: l.student.progress.map((p) => ({
          contentId: p.content.id,
          titleFr: p.content.titleFr,
          titleAr: p.content.titleAr,
          subject: p.content.subject,
          progressPercent: p.progressPercent,
          completed: p.completed,
          detailPath: `/content/${p.content.id}`,
        })),
      },
    })),
  }
}

export async function runGetMyProgress(session: AgentSession, limit = 15) {
  if (!canUseSubscriptionTools(session.role)) {
    return {
      error:
        session.lang === "ar"
          ? "هذه الأداة للتلاميذ والمعلمين. الأولياء: getChildProgress."
          : "Réservé aux élèves/enseignants. Parents: getChildProgress.",
    }
  }
  const items = await prisma.progress.findMany({
    where: { userId: session.userId },
    include: {
      content: {
        select: {
          id: true,
          titleFr: true,
          titleAr: true,
          subject: true,
          grade: true,
          contentType: true,
        },
      },
    },
    orderBy: { lastAccessed: "desc" },
    take: Math.min(20, Math.max(1, limit)),
  })
  return {
    progressPage: "/student/progress",
    count: items.length,
    items: items.map((p) => ({
      contentId: p.content.id,
      titleFr: p.content.titleFr,
      titleAr: p.content.titleAr,
      subject: p.content.subject,
      grade: p.content.grade,
      contentType: p.content.contentType,
      progressPercent: p.progressPercent,
      completed: p.completed,
      lastAccessed: p.lastAccessed.toISOString(),
      detailPath: `/content/${p.content.id}`,
    })),
  }
}

export async function runGetChildProgress(
  session: AgentSession,
  input: { childHint?: string; limit?: number }
) {
  if (!canUseParentTools(session.role)) {
    return {
      error:
        session.lang === "ar"
          ? "هذه الأداة لأولياء الأمور فقط."
          : "Cet outil est réservé aux parents.",
    }
  }

  const links = await loadParentLinks(session.userId)
  const candidates: LinkedChildCandidate[] = links.map((l) => ({
    linkStatus: l.status,
    student: {
      id: l.student.id,
      fullName: l.student.fullName,
      publicId: l.student.publicId,
      email: l.student.email,
    },
  }))

  const matched = matchLinkedChild(candidates, input.childHint)
  if (!matched) {
    return {
      error:
        session.lang === "ar"
          ? candidates.length
            ? "حدّد اسم التلميذ أو رقمه. الأبناء المرتبطون مدرجون في getMyChildren."
            : "لا يوجد أبناء مرتبطون. ادعُ من «أطفالي»."
          : candidates.length
            ? "Précisez le prénom ou le n° compte. Voir getMyChildren pour la liste."
            : "Aucun enfant lié. Invitez depuis « Mes enfants ».",
      childrenPage: "/parent/children",
      availableChildren: candidates.map((c) => ({
        fullName: c.student.fullName,
        publicId: c.student.publicId,
        status: c.linkStatus,
      })),
    }
  }

  if (matched.linkStatus !== "ACCEPTED") {
    return {
      error:
        session.lang === "ar"
          ? `الربط مع ${matched.student.fullName} لم يُقبل بعد (${matched.linkStatus}).`
          : `Le lien avec ${matched.student.fullName} n'est pas encore accepté (${matched.linkStatus}).`,
      childrenPage: "/parent/children",
      status: matched.linkStatus,
    }
  }

  const limit = Math.min(20, Math.max(1, input.limit ?? 15))
  const progress = await prisma.progress.findMany({
    where: { userId: matched.student.id },
    include: {
      content: {
        select: {
          id: true,
          titleFr: true,
          titleAr: true,
          subject: true,
          grade: true,
          contentType: true,
        },
      },
    },
    orderBy: { lastAccessed: "desc" },
    take: limit,
  })

  return {
    child: {
      id: matched.student.id,
      fullName: matched.student.fullName,
      publicId: matched.student.publicId,
    },
    childPage: `/parent/child/${matched.student.id}`,
    count: progress.length,
    items: progress.map((p) => ({
      contentId: p.content.id,
      titleFr: p.content.titleFr,
      titleAr: p.content.titleAr,
      subject: p.content.subject,
      grade: p.content.grade,
      contentType: p.content.contentType,
      progressPercent: p.progressPercent,
      completed: p.completed,
      lastAccessed: p.lastAccessed.toISOString(),
      detailPath: `/content/${p.content.id}`,
    })),
  }
}

export function createAmenallahAgentTools(session: AgentSession) {
  return {
    searchContent: tool({
      description:
        "Search published educational content (courses, books, series, animations). Pass subject/grade enums or keywords in query (arabe, maths, année 4…). Never invent titles.",
      inputSchema: z.object({
        query: z.string().optional().describe("Keywords in French or Arabic"),
        grade: z
          .enum(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"])
          .optional(),
        subject: z
          .enum([
            "ARABIC",
            "FRENCH",
            "MATH",
            "SCIENCE",
            "ISLAMIC",
            "HISTORY",
            "CIVIC",
            "ARTS",
            "ENGLISH",
          ])
          .optional(),
        contentType: z.enum(["COURSE", "BOOK", "SERIES", "ANIMATION"]).optional(),
        limit: z.number().int().min(1).max(10).optional().default(5),
      }),
      execute: async (input) => runSearchContent(session, input),
    }),

    explainContent: tool({
      description:
        "Explain a specific published content item by id: what it is, who it is for, and how to use it. Never invent titles.",
      inputSchema: z.object({
        contentId: z.string().min(1).describe("Content UUID from searchContent"),
      }),
      execute: async ({ contentId }) => runExplainContent(session, contentId),
    }),

    getPricingPlans: tool({
      description: "List Amenallah subscription plans with TND prices and checkout links.",
      inputSchema: z.object({}),
      execute: async () => runGetPricingPlans(session),
    }),

    getMySubscription: tool({
      description: "Get the current user's active subscription period (student/teacher).",
      inputSchema: z.object({}),
      execute: async () => runGetMySubscription(session),
    }),

    getMyProgress: tool({
      description: "List the current student's (or teacher's) recent learning progress on contents.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional().default(15),
      }),
      execute: async ({ limit }) => runGetMyProgress(session, limit),
    }),

    getMyChildren: tool({
      description:
        "List linked children for a parent, with subscription and recent progress (top 3 each).",
      inputSchema: z.object({}),
      execute: async () => runGetMyChildren(session),
    }),

    getChildProgress: tool({
      description:
        "For parents: get courses/contents a linked child has studied (progress %). Pass child first name, publicId, or email.",
      inputSchema: z.object({
        childHint: z
          .string()
          .optional()
          .describe("Child first/full name, 8-digit publicId, or email"),
        limit: z.number().int().min(1).max(20).optional().default(15),
      }),
      execute: async (input) => runGetChildProgress(session, input),
    }),

    getPlatformHelp: tool({
      description:
        "Get curated how-to help for browsing, paying, subscriptions, and parent–student linking.",
      inputSchema: z.object({
        topic: z
          .enum(["browse", "payment", "subscription", "parent_link", "general"])
          .describe("Help topic"),
      }),
      execute: async ({ topic }) => getPlatformHelpSnippet(topic, session.lang, session.role),
    }),
  }
}
