import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { progressSchema } from "@/lib/validations"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ items: [] })
  const items = await prisma.progress.findMany({
    where: { userId: session.user.id },
    include: { content: true },
    orderBy: { lastAccessed: "desc" },
    take: 20,
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = progressSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

    const { contentId, progressPercent } = parsed.data
    const progress = await prisma.progress.upsert({
      where: { userId_contentId: { userId: session.user.id, contentId } },
      update: { progressPercent, completed: progressPercent >= 100, lastAccessed: new Date() },
      create: { userId: session.user.id, contentId, progressPercent, completed: progressPercent >= 100 },
    })
    return NextResponse.json(progress)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
