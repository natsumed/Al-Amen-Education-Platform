#!/usr/bin/env node
/**
 * Register a verified APK already placed in /srv/amenallah/releases.
 * Intended to run inside prod-app; it never accepts an arbitrary filesystem
 * path and therefore cannot be used to publish a file outside the release
 * volume.
 */
import { createHash } from "node:crypto"
import { readFile, realpath, stat } from "node:fs/promises"
import path from "node:path"
import { PrismaClient } from "@prisma/client"

const RELEASE_ROOT = "/srv/amenallah/releases"
const manifestArgument = process.argv[2]
if (!manifestArgument) throw new Error("Usage: register-mobile-release.mjs <manifest-path>")

const root = await realpath(RELEASE_ROOT)
const manifestPath = await realpath(manifestArgument)
if (!manifestPath.startsWith(`${root}${path.sep}`) || path.basename(manifestPath) !== "manifest.json") {
  throw new Error("Manifest must reside below the trusted release root")
}
const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
if (manifest.platform !== "ANDROID" || manifest.artifactType !== "APK") throw new Error("Only Android APK manifests are accepted")
if (!/^\d+\.\d+\.\d+$/.test(manifest.version) || !Number.isInteger(manifest.buildNumber) || manifest.buildNumber < 1) throw new Error("Invalid version or build number")
if (!/^[a-f0-9]{64}$/i.test(manifest.sha256) || !/^[a-f0-9]{64}$/i.test(manifest.signatureSha256 || "")) throw new Error("Checksum or signing certificate digest missing")
if (!/^[a-f0-9]{7,64}$/i.test(manifest.sourceCommit || "")) throw new Error("Source commit missing")
if (manifest.packageName !== "tn.amenallah.education" || manifest.signatureVerified !== true) throw new Error("APK identity has not been verified")

const apkPath = await realpath(path.join(path.dirname(manifestPath), "amenallah.apk"))
if (!apkPath.startsWith(`${root}${path.sep}`)) throw new Error("APK must reside below the trusted release root")
const apk = await readFile(apkPath)
const apkStat = await stat(apkPath)
const sha256 = createHash("sha256").update(apk).digest("hex")
if (sha256 !== manifest.sha256 || String(apkStat.size) !== String(manifest.sizeBytes)) throw new Error("APK checksum or size mismatch")

const publicUrl = `/downloads/android/${manifest.version}/${manifest.buildNumber}/amenallah.apk`
const prisma = new PrismaClient()
try {
  const previous = await prisma.mobileRelease.findFirst({
    where: { platform: "ANDROID", isPublished: true },
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
  })
  if (previous && manifest.buildNumber <= previous.buildNumber && previous.buildNumber !== manifest.buildNumber) {
    throw new Error("Build number must be greater than the current production release")
  }
  const existing = await prisma.mobileRelease.findUnique({ where: { platform_buildNumber: { platform: "ANDROID", buildNumber: manifest.buildNumber } } })
  if (existing && existing.checksumSha256 !== sha256) throw new Error("Build number already belongs to another artifact")
  const values = {
    artifactType: "APK",
    version: manifest.version,
    url: publicUrl,
    checksumSha256: sha256,
    signatureSha256: manifest.signatureSha256,
    sizeBytes: BigInt(apkStat.size),
    sourceCommit: manifest.sourceCommit,
  }
  const release = existing
    ? await prisma.mobileRelease.update({ where: { id: existing.id }, data: values })
    : await prisma.mobileRelease.create({ data: { platform: "ANDROID", buildNumber: manifest.buildNumber, ...values } })
  if (process.env.MOBILE_RELEASE_PUBLISH === "true") {
    await prisma.mobileRelease.update({ where: { id: release.id }, data: { isPublished: true, publishedAt: new Date(), releasedAt: new Date() } })
  }
  console.log(JSON.stringify({ id: release.id, platform: "ANDROID", buildNumber: manifest.buildNumber, published: process.env.MOBILE_RELEASE_PUBLISH === "true" }))
} finally {
  await prisma.$disconnect()
}
