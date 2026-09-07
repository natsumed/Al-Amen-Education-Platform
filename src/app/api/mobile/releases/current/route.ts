import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const [android, ios] = await Promise.all([
    prisma.mobileRelease.findFirst({
      where: { platform: "ANDROID", isPublished: true },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    }),
    prisma.mobileRelease.findFirst({
      where: { platform: "IOS", isPublished: true },
      orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const serialize = (release: typeof android) => release ? {
    platform: release.platform,
    version: release.version,
    buildNumber: release.buildNumber,
    url: release.url,
    checksumSha256: release.checksumSha256,
    sizeBytes: release.sizeBytes?.toString() || null,
    minimumVersion: release.minimumVersion,
    appStoreUrl: release.appStoreUrl,
    releasedAt: release.releasedAt?.toISOString() || null,
  } : null

  return NextResponse.json(
    { ready: Boolean(android && ios), android: serialize(android), ios: serialize(ios) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  )
}
