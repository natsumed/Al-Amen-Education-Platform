import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reviewSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 })

    const review = await prisma.review.upsert({
      where: { userId_contentId: { userId: session.user.id, contentId: parsed.data.contentId } },
      update: { rating: parsed.data.rating, comment: parsed.data.comment },
      create: { userId: session.user.id, ...parsed.data },
    })
    return NextResponse.json(review)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
