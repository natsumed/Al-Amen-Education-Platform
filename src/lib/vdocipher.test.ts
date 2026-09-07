import { afterEach, describe, expect, it, vi } from "vitest"
import { createVdoCipherPlayback } from "./vdocipher"

describe("createVdoCipherPlayback", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.VDOCIPHER_API_SECRET
  })

  it("keeps the API secret server-side and requests five-minute playback", async () => {
    process.env.VDOCIPHER_API_SECRET = "server-secret"
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ otp: "otp-value", playbackInfo: "playback-value" }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(createVdoCipherPlayback({
      videoId: "video_12345678",
      viewerId: "public-user-1",
      watermarkText: "public-user-1 · ABC123 · 2026-09-07",
      restrictToWebDomain: true,
    })).resolves.toEqual({ otp: "otp-value", playbackInfo: "playback-value" })

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.Authorization).toBe("Apisecret server-secret")
    const body = JSON.parse(options.body)
    expect(body.ttl).toBe(300)
    expect(body.userId).toBe("public-user-1")
    expect(body.whitelisthref).toContain("amanallahedition")
    expect(JSON.stringify(body)).not.toContain("server-secret")
  })

  it("fails closed without credentials", async () => {
    await expect(createVdoCipherPlayback({
      videoId: "video_12345678",
      viewerId: "viewer",
      watermarkText: "viewer",
    })).rejects.toThrow("VDOCIPHER_NOT_CONFIGURED")
  })
})
