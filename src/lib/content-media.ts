/**
 * Content media access helpers.
 *
 * Real PDFs/videos/animations will live on Drive (or similar) later.
 * Until then, admins paste placeholder URLs. This layer ensures:
 * 1) Locked content never leaks media URLs in list/detail APIs
 * 2) Unlocked media is served via a gated endpoint clients call after auth
 */

export type MediaFields = {
  youtubeUrl?: string | null
  pdfUrl?: string | null
  gifUrl?: string | null
  thumbnailUrl?: string | null
  fileUrls?: string | unknown
}

const MEDIA_KEYS = ["youtubeUrl", "pdfUrl", "gifUrl", "fileUrls"] as const

/** Public list cards may show thumbnail only — never paywalled media. */
export function stripMediaForList<T extends MediaFields>(content: T): T {
  const { youtubeUrl: _y, pdfUrl: _p, gifUrl: _g, fileUrls: _f, ...rest } = content as T & MediaFields
  return {
    ...rest,
    youtubeUrl: null,
    pdfUrl: null,
    gifUrl: null,
    fileUrls: "[]",
  } as T
}

/**
 * Detail responses: keep metadata; redact media unless the user can access.
 * Thumbnail stays for marketing/preview.
 */
export function sanitizeContentForAccess<T extends MediaFields>(
  content: T,
  canAccess: boolean
): T {
  if (canAccess) return content

  return {
    ...content,
    youtubeUrl: null,
    pdfUrl: null,
    gifUrl: null,
    fileUrls: "[]",
  }
}

export function parseFileUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Convert common Google Drive share links into a viewer/embed-friendly URL.
 * Leave other URLs unchanged (YouTube, direct CDN, etc.).
 */
export function normalizeExternalMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // https://drive.google.com/file/d/FILE_ID/view?...
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (fileMatch?.[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`
  }

  // https://drive.google.com/open?id=FILE_ID
  const openMatch = trimmed.match(/[?&]id=([^&]+)/)
  if (trimmed.includes("drive.google.com") && openMatch?.[1]) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`
  }

  return trimmed
}

export function hasAnyMedia(content: MediaFields): boolean {
  const files = parseFileUrls(content.fileUrls)
  return Boolean(content.youtubeUrl || content.pdfUrl || content.gifUrl || files.length)
}

export { MEDIA_KEYS }
