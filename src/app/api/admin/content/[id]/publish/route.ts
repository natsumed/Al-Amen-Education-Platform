import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const content = await prisma.content.findUnique({
    where: { id },
    include: { assets: { where: { assetRole: "PRIMARY" }, select: { id: true, status: true, kind: true } } },
  })
  if (!content) return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 })
  if (!content.displayTitle || !content.contentType || !content.audience) return NextResponse.json({ error: "Le titre, le type et l'audience sont requis" }, { status: 422 })
  if (content.category === "INTERNAL_PRODUCTION" || content.category === "REVIEW_REQUIRED") return NextResponse.json({ error: "Cette catégorie ne peut pas être publiée" }, { status: 422 })
  const primary = content.assets.find((asset) => asset.status === "READY")
  if (!primary) return NextResponse.json({ error: "Un asset primaire sécurisé prêt est requis avant publication" }, { status: 422 })
  if (!content.isFree && (!content.priceMillis || content.priceMillis <= 0)) return NextResponse.json({ error: "Un contenu payant doit avoir un prix positif" }, { status: 422 })

  const updated = await prisma.$transaction(async (tx) => {
    const published = await tx.content.update({ where: { id }, data: { status: "PUBLISHED" } })
    await tx.auditEvent.create({ data: { userId: user.id, action: "CONTENT_PUBLISHED", targetType: "Content", targetId: id, metadata: { assetId: primary.id } } })
    return published
  })
  return NextResponse.json({ content: updated, assetId: primary.id }, { headers: { "Cache-Control": "private, no-store" } })
}
