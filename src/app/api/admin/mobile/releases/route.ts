import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const releases = await prisma.mobileRelease.findMany({ orderBy: [{ platform: "asc" }, { buildNumber: "desc" }] })
  return NextResponse.json(releases.map((release) => ({ ...release, sizeBytes: release.sizeBytes?.toString() || null })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const input = body || {}
  const platform = typeof input.platform === "string" ? input.platform.toUpperCase() : ""
  const artifactType = typeof input.artifactType === "string" ? input.artifactType.toUpperCase() : "APK"
  const version = typeof input.version === "string" ? input.version.trim() : ""
  const buildNumber = Number(input.buildNumber)
  const url = typeof input.url === "string" ? input.url.trim() : ""
  const validUrl = /^\/downloads\//.test(url) || /^https:\/\//.test(url)
  if (!["ANDROID", "IOS"].includes(platform) || (platform === "ANDROID" && artifactType !== "APK") || (platform === "IOS" && artifactType !== "STORE") || !/^\d+\.\d+\.\d+$/.test(version) || !Number.isInteger(buildNumber) || buildNumber < 1 || !validUrl) {
    return NextResponse.json({ error: "Release fields invalides" }, { status: 400 })
  }
  const release = await prisma.mobileRelease.create({
    data: {
      platform, artifactType, version, buildNumber, url,
      checksumSha256: typeof input.checksumSha256 === "string" ? input.checksumSha256 : null,
      signatureSha256: typeof input.signatureSha256 === "string" ? input.signatureSha256 : null,
      sizeBytes: Number.isInteger(Number(input.sizeBytes)) ? BigInt(Number(input.sizeBytes)) : null,
      minimumVersion: typeof input.minimumVersion === "string" ? input.minimumVersion : null,
      minimumBuildNumber: Number.isInteger(Number(input.minimumBuildNumber)) ? Number(input.minimumBuildNumber) : null,
      appStoreUrl: typeof input.appStoreUrl === "string" ? input.appStoreUrl : null,
      sourceCommit: typeof input.sourceCommit === "string" && /^[a-f0-9]{7,64}$/i.test(input.sourceCommit) ? input.sourceCommit : null,
      isMandatory: input.isMandatory === true,
    },
  })
  return NextResponse.json({ ...release, sizeBytes: release.sizeBytes?.toString() || null }, { status: 201 })
}
