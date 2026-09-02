import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getContentAccessInfo } from "@/lib/access-control"
import { getRequestUser } from "@/lib/request-auth"
import { normalizeExternalMediaUrl, parseFileUrls } from "@/lib/content-media"
import { getSignedUrl } from "@/lib/storage"

async function resolveMediaUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null
  const normalized = normalizeExternalMediaUrl(value)
  if (!normalized) return null
  if (!/^https?:\/\//i.test(normalized)) return getSignedUrl(normalized)
  if (normalized.includes("/storage/v1/object/public/content/")) return getSignedUrl(normalized)
  return normalized
}

/**
 * Gated media resolver — call after the client knows it has access.
 * Returns normalized Drive/YouTube/PDF URLs only when authorized.
 * Actual Drive files will be pasted by admins later; this endpoint is ready.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getRequestUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const content = await prisma.content.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        isFree: true,
        youtubeUrl: true,
        pdfUrl: true,
        gifUrl: true,
        fileUrls: true,
        contentType: true,
        status: true,
      },
    })

    if (!content || content.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const access = await getContentAccessInfo(user.id, user.role, params.id)
    if (!access.canAccess) {
      return NextResponse.json(
        { error: "Subscription required", code: "MEDIA_LOCKED", access },
        { status: 403 }
      )
    }

    const files = (await Promise.all(parseFileUrls(content.fileUrls).map(resolveMediaUrl))).filter(Boolean)

    return NextResponse.json({
      contentId: content.id,
      contentType: content.contentType,
      canDownload: access.canDownload,
      media: {
        youtubeUrl: normalizeExternalMediaUrl(content.youtubeUrl),
        pdfUrl: await resolveMediaUrl(content.pdfUrl),
        gifUrl: await resolveMediaUrl(content.gifUrl),
        fileUrls: files,
      },
      // Hint for clients: Drive preview URLs open in iframe / WebView
      source: "external",
      note: "Media URLs are ready for Drive share links when provided by admins.",
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
