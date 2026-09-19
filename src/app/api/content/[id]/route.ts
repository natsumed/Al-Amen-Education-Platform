import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateContentSchema } from "@/lib/validations"
import { getContentAccessInfo } from "@/lib/access-control"
import { sanitizeContentForAccess } from "@/lib/content-media"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getRequestUser(req)
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { fullName: true } },
        reviews: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
        assets: { where: { assetRole: "PRIMARY", status: "READY" }, select: { id: true, kind: true, deliveryProvider: true } },
      },
    })
    if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const isAdmin = user?.role === "ADMIN"
    const hasReadyAsset = content.assets.some((asset) => asset.deliveryProvider === "VDOCIPHER" || asset.deliveryProvider === "SUPABASE_TILES")
    if (!isAdmin && (content.status !== "PUBLISHED" || !hasReadyAsset)) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const access = await getContentAccessInfo(user?.id || null, user?.role || null, id)
    // Never expose external media URLs to anonymous visitors. Even free media
    // is resolved through the authenticated media endpoint below.
    const { assets: _assets, ...contentWithoutAssets } = content
    void _assets
    const safe = sanitizeContentForAccess(contentWithoutAssets, Boolean(user) && access.canAccess)

    return NextResponse.json({ ...safe, access, mediaLocked: !user || !access.canAccess, deliveryMode: process.env.MOBILE_NATIVE_CONTENT_ONLY === "true" ? "NATIVE_APP" : "MIGRATION" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateContentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const existing = await prisma.content.findUnique({ where: { id }, select: { isFree: true, price: true, priceMillis: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const isFree = parsed.data.isFree ?? existing.isFree
    const priceMillis = isFree ? null : parsed.data.priceMillis
      ?? (parsed.data.price == null
        ? existing.priceMillis ?? (existing.price == null ? 0 : Math.round(existing.price * 1_000))
        : Math.round(parsed.data.price * 1_000))
    if (!isFree && (priceMillis == null || !Number.isSafeInteger(priceMillis) || priceMillis <= 0)) {
      return NextResponse.json({ error: "Un contenu payant doit avoir un prix positif" }, { status: 400 })
    }
    const content = await prisma.content.update({
      where: { id },
      data: { ...parsed.data, priceMillis, price: priceMillis == null ? null : priceMillis / 1_000 },
    })
    return NextResponse.json(content)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const activePurchases = await prisma.purchase.count({ where: { contentId: id, status: "ACTIVE" } })
    if (activePurchases > 0) {
      await prisma.content.update({ where: { id }, data: { status: "DRAFT" } })
      await prisma.auditEvent.create({
        data: { userId: session.user.id, action: "PURCHASED_CONTENT_ARCHIVED", targetType: "Content", targetId: id, metadata: { activePurchases } },
      })
      return NextResponse.json({ message: "Contenu archivé pour préserver les achats existants", archived: true })
    }
    await prisma.content.delete({ where: { id } })
    return NextResponse.json({ message: "Supprimé", archived: false })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
