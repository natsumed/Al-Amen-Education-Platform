import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const content = await prisma.content.findUnique({
    where: { id },
    select: {
      id: true, displayTitle: true, primaryLanguage: true, titleAr: true, titleFr: true, titleEn: true,
      descriptionAr: true, descriptionFr: true, descriptionEn: true, grade: true, subject: true,
      contentType: true, language: true, audience: true, category: true, collectionKey: true, storyKey: true,
      editionLabel: true, isFree: true, priceMillis: true, status: true, createdAt: true, updatedAt: true,
      assets: { select: { id: true, kind: true, status: true, assetRole: true, deliveryProvider: true, failureReason: true, pageCount: true } },
    },
  })
  if (!content) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })
  return NextResponse.json({ content }, { headers: { "Cache-Control": "private, no-store" } })
}
