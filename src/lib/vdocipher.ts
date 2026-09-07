export type VdoCipherPlayback = {
  otp: string
  playbackInfo: string
}

type PlaybackAuthorizationInput = {
  videoId: string
  viewerId: string
  watermarkText: string
  restrictToWebDomain?: boolean
}

export async function createVdoCipherPlayback(
  input: PlaybackAuthorizationInput
): Promise<VdoCipherPlayback> {
  const secret = process.env.VDOCIPHER_API_SECRET
  if (!secret) throw new Error("VDOCIPHER_NOT_CONFIGURED")
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(input.videoId)) throw new Error("INVALID_VIDEO_ID")

  const annotation = JSON.stringify([
    {
      type: "rtext",
      text: input.watermarkText.slice(0, 100),
      alpha: "0.55",
      color: "0xFFFFFF",
      size: "14",
      interval: "5000",
      skip: "5000",
    },
  ])

  const body: Record<string, string | number> = {
    ttl: 300,
    userId: input.viewerId.slice(0, 36),
    annotate: annotation,
  }
  if (input.restrictToWebDomain) body.whitelisthref = "(^|\\.)amanallahedition\\.com$"

  const response = await fetch(
    `https://dev.vdocipher.com/api/videos/${encodeURIComponent(input.videoId)}/otp`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Apisecret ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  )

  if (!response.ok) throw new Error(`VDOCIPHER_HTTP_${response.status}`)
  const result = await response.json() as Partial<VdoCipherPlayback>
  if (typeof result.otp !== "string" || typeof result.playbackInfo !== "string") {
    throw new Error("VDOCIPHER_INVALID_RESPONSE")
  }
  return { otp: result.otp, playbackInfo: result.playbackInfo }
}
