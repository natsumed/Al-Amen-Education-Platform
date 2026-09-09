import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams
  const requestedPlatform = query.get("platform")?.toUpperCase()
  const requestedBuild = Number(query.get("build") || 0)
  const platforms = requestedPlatform === "ANDROID" || requestedPlatform === "IOS" ? [requestedPlatform] : ["ANDROID", "IOS"]
  const [android, ios] = await Promise.all([
    platforms.includes("ANDROID") ? prisma.mobileRelease.findFirst({ where: { platform: "ANDROID", isPublished: true }, orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }] }) : null,
    platforms.includes("IOS") ? prisma.mobileRelease.findFirst({ where: { platform: "IOS", isPublished: true }, orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }] }) : null,
  ])

  const serialize = (release: typeof android) => release ? {
    platform: release.platform,
    artifactType: release.artifactType,
    version: release.version,
    buildNumber: release.buildNumber,
    url: release.url,
    checksumSha256: release.checksumSha256,
    sizeBytes: release.sizeBytes?.toString() || null,
    minimumVersion: release.minimumVersion,
    minimumBuildNumber: release.minimumBuildNumber,
    isMandatory: release.isMandatory,
    appStoreUrl: release.appStoreUrl,
    releasedAt: release.releasedAt?.toISOString() || null,
    updateRequired: Boolean(release.isMandatory && requestedBuild > 0 && release.minimumBuildNumber && requestedBuild < release.minimumBuildNumber),
  } : null

  return NextResponse.json(
    { ready: Boolean(android || ios), updateRequired: Boolean((android && serialize(android)?.updateRequired) || (ios && serialize(ios)?.updateRequired)), android: serialize(android), ios: serialize(ios) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  )
}
