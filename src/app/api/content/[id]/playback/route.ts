import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canAccessContent } from "@/lib/access-control"
import { getRequestUser } from "@/lib/request-auth"
import { playbackLimiter } from "@/lib/rate-limit"
import { generateOpaqueToken, hashNetworkIdentifier } from "@/lib/security-crypto"
import { createVdoCipherPlayback } from "@/lib/vdocipher"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (process.env.SECURE_CONTENT_ENABLED !== "true") {
    return NextResponse.json({ error: "Secure playback is not enabled" }, { status: 503 })
  }

  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const limit = await playbackLimiter.check(user.id)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes de lecture", retryAt: limit.resetAt },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    )
  }

  const content = await prisma.content.findFirst({
    where: { id, status: "PUBLISHED" },
    select: {
      id: true,
      isFree: true,
      assets: {
        where: { kind: "VIDEO", status: "READY", deliveryProvider: "VDOCIPHER" },
        select: { id: true, deliveryAssetId: true },
        take: 1,
      },
    },
  })
  const asset = content?.assets[0]
  if (!content || !asset?.deliveryAssetId) {
    return NextResponse.json({ error: "Protected video unavailable" }, { status: 404 })
  }
  if (!(await canAccessContent(user.id, user.role, content))) {
    return NextResponse.json({ error: "Subscription required", code: "MEDIA_LOCKED" }, { status: 403 })
  }

  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const ipHash = hashNetworkIdentifier(rawIp)
  const now = new Date()
  const active = await prisma.playbackSession.findFirst({
    where: { userId: user.id, endedAt: null, expiresAt: { gt: now } },
    select: { id: true, contentId: true, deviceSessionId: true, ipHash: true },
    orderBy: { createdAt: "desc" },
  })

  const sameClient = active && active.contentId === content.id && (
    user.deviceSessionId ? active.deviceSessionId === user.deviceSessionId : active.ipHash === ipHash
  )
  if (active && !sameClient) {
    return NextResponse.json(
      { error: "Une autre lecture premium est déjà active", code: "CONCURRENT_STREAM" },
      { status: 409, headers: { "Cache-Control": "no-store" } }
    )
  }
  if (active) {
    await prisma.playbackSession.update({ where: { id: active.id }, data: { endedAt: now } })
  }

  const sessionCode = generateOpaqueToken(9)
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const body = await req.json().catch(() => ({}))
  const client = body && body.client === "mobile" ? "mobile" : "web"
  if (client === "mobile" && process.env.MOBILE_ATTESTATION_ENFORCED === "true") {
    if (!user.deviceSessionId) return NextResponse.json({ error: "Device session required" }, { status: 403 })
    const trustedDevice = await prisma.deviceSession.findFirst({
      where: { id: user.deviceSessionId, userId: user.id, revokedAt: null, attestedAt: { not: null } },
      select: { id: true },
    })
    if (!trustedDevice) {
      return NextResponse.json({ error: "Device attestation required", code: "DEVICE_NOT_ATTESTED" }, { status: 403 })
    }
  }

  try {
    const playback = await createVdoCipherPlayback({
      videoId: asset.deliveryAssetId,
      viewerId: user.id,
      watermarkText: `${user.id.slice(0, 8)} · ${sessionCode} · ${new Date().toISOString()}`,
      restrictToWebDomain: client === "web",
    })
    await prisma.playbackSession.create({
      data: {
        sessionCode,
        userId: user.id,
        contentId: content.id,
        assetId: asset.id,
        deviceSessionId: user.deviceSessionId,
        ipHash,
        expiresAt,
      },
    })
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        action: "CONTENT_PLAYBACK_AUTHORIZED",
        targetType: "Content",
        targetId: content.id,
        ipHash,
        metadata: { assetId: asset.id, sessionCode, client },
      },
    })

    return NextResponse.json(
      { ...playback, videoId: asset.deliveryAssetId, sessionCode, expiresIn: 300 },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    const code = error instanceof Error ? error.message : "PLAYBACK_FAILED"
    const status = code === "VDOCIPHER_NOT_CONFIGURED" ? 503 : 502
    return NextResponse.json({ error: "Protected playback unavailable", code }, { status })
  }
}
