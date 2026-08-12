import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripMediaForList } from "@/lib/content-media"
import { getRequestUser } from "@/lib/request-auth"
import { progressSchema } from "@/lib/validations"

const LEARNER_ROLES = new Set(["STUDENT", "TEACHER", "ADMIN"])

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || !LEARNER_ROLES.has(user.role)) return NextResponse.json({ items: [] })

  const items = await prisma.progress.findMany({
    where: { userId: user.id },
    include: { content: true },
    orderBy: { lastAccessed: "desc" },
    take: 20,
  })

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      content: item.content ? stripMediaForList(item.content) : item.content,
    })),
  })
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user || !LEARNER_ROLES.has(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = progressSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

    const { contentId, progressPercent } = parsed.data
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true },
    })
    if (!content) {
      return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })
    }

    const progress = await prisma.progress.upsert({
      where: { userId_contentId: { userId: user.id, contentId } },
      update: { progressPercent, completed: progressPercent >= 100, lastAccessed: new Date() },
      create: { userId: user.id, contentId, progressPercent, completed: progressPercent >= 100 },
    })
    return NextResponse.json(progress)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
