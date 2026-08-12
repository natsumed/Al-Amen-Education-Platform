import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { reviewSchema } from "@/lib/validations"

const LEARNER_ROLES = new Set(["STUDENT", "TEACHER", "ADMIN"])

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user || !LEARNER_ROLES.has(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

    const content = await prisma.content.findUnique({
      where: { id: parsed.data.contentId },
      select: { id: true },
    })
    if (!content) {
      return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })
    }

    const review = await prisma.review.upsert({
      where: { userId_contentId: { userId: user.id, contentId: parsed.data.contentId } },
      update: { rating: parsed.data.rating, comment: parsed.data.comment },
      create: { userId: user.id, ...parsed.data },
    })
    return NextResponse.json(review)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
