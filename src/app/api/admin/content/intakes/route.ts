import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { encryptSecret } from "@/lib/security-crypto"
import { classifyDrivePath, detectDriveLanguage, driveConfigured, driveMastersFolderId, hashDriveId, listDriveTree } from "@/lib/drive"

const scanSchema = z.object({
  sourceType: z.enum(["DRIVE_ROOT", "DRIVE_FOLDER", "DRIVE_FILE"]).default("DRIVE_ROOT"),
  sourceId: z.string().trim().min(10).max(200).optional(),
})

const supportedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
])

function publicIntake<T extends { sourceRefEncrypted?: string | null }>(intake: T) {
  const { sourceRefEncrypted: _sourceRef, ...safe } = intake
  const withSize = safe as typeof safe & { sizeBytes?: bigint | number | null }
  return {
    ...withSize,
    sizeBytes: typeof withSize.sizeBytes === "bigint" ? withSize.sizeBytes.toString() : withSize.sizeBytes,
  }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const status = new URL(req.url).searchParams.get("status") || undefined
  const intakes = await prisma.contentIntake.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return NextResponse.json({ intakes: intakes.map(publicIntake) }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (!driveConfigured()) return NextResponse.json({ error: "Drive intake is not configured" }, { status: 503 })
  const parsed = scanSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid Drive scan request" }, { status: 400 })

  const mastersRootId = driveMastersFolderId()
  if (parsed.data.sourceType !== "DRIVE_ROOT" && parsed.data.sourceId !== mastersRootId) {
    return NextResponse.json({ error: "Only the configured private masters folder may be scanned" }, { status: 403 })
  }

  let files
  try {
    files = await listDriveTree(mastersRootId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "DRIVE_SCAN_FAILED"
    return NextResponse.json({ error: "Drive scan failed", code: message }, { status: 502 })
  }

  const candidates = files.filter((file) => supportedMimeTypes.has(file.mimeType))
  let created = 0
  let existing = 0
  for (const file of candidates) {
    const sourceFileIdHash = hashDriveId(file.id)
    const already = await prisma.contentIntake.findUnique({ where: { sourceFileIdHash }, select: { id: true } })
    if (already) {
      existing += 1
      continue
    }
    const classification = classifyDrivePath(file.relativePath, file.name)
    const encrypted = encryptSecret(`drive:file:${file.id}`)
    await prisma.contentIntake.create({
      data: {
        sourceType: "DRIVE_FILE",
        sourceProvider: "DRIVE",
        sourceRefEncrypted: encrypted,
        sourceFileIdHash,
        sourceFileName: file.name,
        sourceFolder: file.relativePath.split("/").slice(0, -1).join("/") || null,
        mimeType: file.mimeType,
        sizeBytes: file.size ? BigInt(file.size) : null,
        language: detectDriveLanguage(file.relativePath, file.name),
        category: classification.category,
        audience: classification.audience,
        editionLabel: classification.editionLabel,
        ownership: file.owners?.some((owner) => owner.emailAddress === process.env.GOOGLE_DRIVE_OWNER_EMAIL) ? "OWNED" : "SHARED",
        sharingState: file.permissions?.some((permission) => permission.type === "anyone") ? "PUBLIC_LINK_RISK" : "RESTRICTED_OR_UNKNOWN",
        status: "RECEIVED",
      },
    })
    created += 1
  }

  return NextResponse.json({ scanned: candidates.length, created, existing }, { status: 201 })
}
