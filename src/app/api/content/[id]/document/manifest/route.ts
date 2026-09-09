import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canAccessContent } from "@/lib/access-control"
import { getRequestUser } from "@/lib/request-auth"
import { signDocumentGrant } from "@/lib/document-access"
import { hasNativeContentSession } from "@/lib/native-content"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.SECURE_CONTENT_ENABLED !== "true") {
    return NextResponse.json({ error: "Secure documents are not enabled" }, { status: 503 })
  }
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await hasNativeContentSession(req, user))) return NextResponse.json({ error: "Protected content requires the Amenallah app", code: "NATIVE_APP_REQUIRED" }, { status: 403 })
  const { id } = await params
  const requestedPage = Math.max(1, Number(new URL(req.url).searchParams.get("page") || 1))
  const content = await prisma.content.findFirst({
    where: { id, status: "PUBLISHED" },
    select: {
      id: true,
      isFree: true,
      assets: {
        where: { kind: "DOCUMENT", status: "READY", deliveryProvider: "SUPABASE_TILES" },
        select: { id: true, pageCount: true },
        take: 1,
      },
    },
  })
  const asset = content?.assets[0]
  if (!content || !asset?.pageCount) return NextResponse.json({ error: "Protected document unavailable" }, { status: 404 })
  if (!(await canAccessContent(user.id, user.role, content))) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 })
  }
  const pageCount = asset.pageCount
  const current = Math.min(requestedPage, pageCount)
  const pages = [current - 1, current, current + 1].filter((page) => page >= 1 && page <= pageCount)
  const token = await signDocumentGrant({ userId: user.id, contentId: content.id, assetId: asset.id, pages })
  return NextResponse.json({
    contentId: content.id,
    pageCount,
    currentPage: current,
    pages: pages.map((page) => ({ page, url: `/api/content/${content.id}/document/page/${page}?token=${encodeURIComponent(token)}` })),
    expiresIn: 300,
  }, { headers: { "Cache-Control": "private, no-store" } })
}
