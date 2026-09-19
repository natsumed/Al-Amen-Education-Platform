import { createHash } from "node:crypto"
import { execFile } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { promisify } from "node:util"
import path from "node:path"
import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { decryptSecret } from "@/lib/security-crypto"
import { downloadDriveFile, hasExpectedFileSignature } from "@/lib/drive"
import { uploadBuffer } from "@/lib/storage"
import { proposeContentMetadata } from "@/lib/ai/content-ingestion"

const execFileAsync = promisify(execFile)

function sourceFileId(value: string) {
  const match = value.match(/^drive:file:([A-Za-z0-9_-]+)$/)
  if (!match) throw new Error("DRIVE_SOURCE_REF_INVALID")
  return match[1]
}

async function scanFile(filePath: string) {
  const scanner = process.env.CLAMSCAN_BIN || "clamscan"
  if (process.env.CONTENT_SCAN_REQUIRED !== "false") {
    try {
      await execFileAsync(scanner, ["--no-summary", filePath], { timeout: 120_000 })
    } catch (error: any) {
      if (error?.code === "ENOENT") throw new Error("CONTENT_SCANNER_NOT_CONFIGURED")
      if (error?.code === 1) throw new Error("CONTENT_MALWARE_DETECTED")
      throw new Error("CONTENT_SCAN_FAILED")
    }
  }
}

async function readPdfText(filePath: string) {
  try {
    const result = await execFileAsync(process.env.PDFTOTEXT_BIN || "pdftotext", ["-enc", "UTF-8", filePath, "-"], { timeout: 120_000, maxBuffer: 2_000_000 })
    return result.stdout.slice(0, 12_000)
  } catch {
    return ""
  }
}

async function pdfPages(filePath: string) {
  try {
    const result = await execFileAsync(process.env.PDFINFO_BIN || "pdfinfo", [filePath], { timeout: 30_000 })
    const match = result.stdout.match(/^Pages:\s+(\d+)/m)
    return match ? Number(match[1]) : null
  } catch {
    return null
  }
}

export async function processContentIntake(intakeId: string) {
  const claimed = await prisma.contentIntake.updateMany({
    where: { id: intakeId, status: "RECEIVED" },
    data: { status: "PROCESSING", errorCode: null, errorMessage: null },
  })
  if (!claimed.count) return false
  const intake = await prisma.contentIntake.findUnique({ where: { id: intakeId } })
  if (!intake?.sourceRefEncrypted) throw new Error("INTAKE_SOURCE_MISSING")
  try {
    const driveId = sourceFileId(decryptSecret(intake.sourceRefEncrypted))
    const buffer = await downloadDriveFile(driveId)
    const checksum = createHash("sha256").update(buffer).digest("hex")
    if (!intake.mimeType || !hasExpectedFileSignature(buffer, intake.mimeType)) throw new Error("CONTENT_SIGNATURE_INVALID")
    const duplicate = await prisma.contentIntake.findFirst({
      where: { checksumSha256: checksum, id: { not: intake.id } },
      select: { id: true },
    })
    const tempDir = await mkdtemp(path.join(tmpdir(), "amenallah-content-"))
    const filePath = path.join(tempDir, intake.sourceFileName.replace(/[^a-zA-Z0-9._-]/g, "_"))
    try {
      await writeFile(filePath, buffer)
      await scanFile(filePath)
      const [text, pageCount] = await Promise.all([
        intake.mimeType === "application/pdf" ? readPdfText(filePath) : Promise.resolve(""),
        intake.mimeType === "application/pdf" ? pdfPages(filePath) : Promise.resolve(null),
      ])
      let proposal
      try {
        const result = await proposeContentMetadata({
          sourceType: intake.sourceType,
          sourceLabel: intake.sourceFileName,
          extractedText: text,
          detectedLanguage: intake.language,
        })
        proposal = result.proposal
      } catch (error) {
        const code = error instanceof Error ? error.message : "AI_ANALYSIS_FAILED"
        if (code === "OPENAI_NOT_CONFIGURED") throw error
        proposal = null
      }
      await prisma.contentIntake.update({
        where: { id: intake.id },
        data: {
          checksumSha256: checksum,
          sizeBytes: BigInt(buffer.length),
          status: duplicate ? "DUPLICATE_REVIEW" : "REVIEW_REQUIRED",
          duplicateOfId: duplicate?.id,
          aiProposal: proposal || undefined,
          language: proposal?.language || intake.language,
          category: proposal?.category || intake.category,
          audience: proposal?.audience || intake.audience,
          titleAr: proposal?.titleAr,
          titleFr: proposal?.titleFr,
          titleEn: proposal?.titleEn,
          grade: proposal?.grade,
          subject: proposal?.subject,
          collectionKey: proposal?.collectionKey,
          storyKey: proposal?.storyKey,
          editionLabel: proposal?.editionLabel || intake.editionLabel,
          reviewNotes: [
            pageCount ? `Pages: ${pageCount}` : "Page count unavailable; verify manually.",
            duplicate ? `Possible duplicate of intake ${duplicate.id}.` : null,
          ].filter(Boolean).join(" "),
        },
      })
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
    return true
  } catch (error) {
    const code = error instanceof Error ? error.message : "CONTENT_PROCESSING_FAILED"
    await prisma.contentIntake.update({
      where: { id: intake.id },
      data: {
        status: code === "CONTENT_SCANNER_NOT_CONFIGURED" ? "WAITING_FOR_SCAN" : code === "OPENAI_NOT_CONFIGURED" ? "WAITING_FOR_CONFIGURATION" : "FAILED",
        errorCode: code,
        errorMessage: code === "OPENAI_NOT_CONFIGURED" ? "AI configuration is required before this intake can be completed." : "The source could not be safely processed.",
      },
    })
    return false
  }
}

export async function processApprovedDocument(assetId: string) {
  const asset = await prisma.contentAsset.findFirst({ where: { id: assetId, status: "PENDING", kind: "DOCUMENT" } })
  if (!asset?.sourceRefEncrypted) return false
  const claimed = await prisma.contentAsset.updateMany({ where: { id: assetId, status: "PENDING" }, data: { status: "PROCESSING" } })
  if (!claimed.count) return false
  const tempDir = await mkdtemp(path.join(tmpdir(), "amenallah-document-"))
  try {
    const buffer = await downloadDriveFile(sourceFileId(decryptSecret(asset.sourceRefEncrypted)))
    const filePath = path.join(tempDir, "source.pdf")
    await writeFile(filePath, buffer)
    await scanFile(filePath)
    const outputPrefix = path.join(tempDir, "page")
    await execFileAsync(process.env.PDFTOPPM_BIN || "pdftoppm", ["-png", "-r", "150", filePath, outputPrefix], { timeout: 300_000 })
    const pages = (await (await import("node:fs/promises")).readdir(tempDir)).filter((name) => /^page-\d+\.png$/.test(name)).sort()
    if (!pages.length) throw new Error("PDF_HAS_NO_PAGES")
    for (let index = 0; index < pages.length; index += 1) {
      const page = await readFile(path.join(tempDir, pages[index]))
      const webp = await sharp(page).webp({ quality: 86 }).toBuffer()
      const uploaded = await uploadBuffer(webp, `document-pages/${asset.id}/${index + 1}.webp`, "image/webp")
      if (!uploaded) throw new Error("DOCUMENT_TILE_STORAGE_UNAVAILABLE")
    }
    await prisma.contentAsset.update({ where: { id: asset.id }, data: { status: "READY", deliveryProvider: "SUPABASE_TILES", pageCount: pages.length, checksumSha256: createHash("sha256").update(buffer).digest("hex") } })
    await prisma.content.update({ where: { id: asset.contentId || "" }, data: { status: "DRAFT" } })
    return true
  } catch (error) {
    await prisma.contentAsset.update({ where: { id: asset.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message : "DOCUMENT_PROCESSING_FAILED" } })
    return false
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
