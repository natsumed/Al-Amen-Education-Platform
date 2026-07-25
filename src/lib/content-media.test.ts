import { describe, it, expect } from "vitest"
import { normalizeExternalMediaUrl, sanitizeContentForAccess, stripMediaForList } from "./content-media"

describe("content-media", () => {
  it("normalizes Google Drive file links to preview", () => {
    const url = "https://drive.google.com/file/d/abc123XYZ/view?usp=sharing"
    expect(normalizeExternalMediaUrl(url)).toBe(
      "https://drive.google.com/file/d/abc123XYZ/preview"
    )
  })

  it("leaves YouTube URLs unchanged", () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    expect(normalizeExternalMediaUrl(url)).toBe(url)
  })

  it("strips media when access denied", () => {
    const content = {
      youtubeUrl: "https://youtube.com/x",
      pdfUrl: "https://drive.google.com/file/d/1/view",
      gifUrl: "https://x.gif",
      fileUrls: '["a"]',
      thumbnailUrl: "https://thumb",
    }
    const locked = sanitizeContentForAccess(content, false)
    expect(locked.youtubeUrl).toBeNull()
    expect(locked.pdfUrl).toBeNull()
    expect(locked.gifUrl).toBeNull()
    expect(locked.thumbnailUrl).toBe("https://thumb")
  })

  it("keeps media when access granted", () => {
    const content = { youtubeUrl: "https://youtube.com/x", pdfUrl: null, gifUrl: null }
    expect(sanitizeContentForAccess(content, true).youtubeUrl).toBe("https://youtube.com/x")
  })

  it("stripMediaForList removes paywalled fields", () => {
    const item = stripMediaForList({
      id: "1",
      youtubeUrl: "https://y",
      pdfUrl: "https://p",
      gifUrl: "https://g",
      thumbnailUrl: "https://t",
      fileUrls: '["f"]',
    })
    expect(item.youtubeUrl).toBeNull()
    expect(item.thumbnailUrl).toBe("https://t")
  })
})

describe("publicId format", () => {
  it("matches 8-digit pattern", () => {
    const ids = ["10000001", "99999999", "10000003"]
    for (const id of ids) {
      expect(/^\d{8}$/.test(id)).toBe(true)
    }
  })
})
