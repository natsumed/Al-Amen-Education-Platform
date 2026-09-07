import { prisma } from "../src/lib/prisma"
import { encryptSecret } from "../src/lib/security-crypto"

async function main() {
  const contents = await prisma.content.findMany({
    where: { assets: { none: {} } },
    select: { id: true, uploadedById: true, contentType: true, youtubeUrl: true, pdfUrl: true, gifUrl: true },
  })
  let created = 0
  for (const content of contents) {
    const source = content.pdfUrl || content.youtubeUrl || content.gifUrl
    if (!source) continue
    const kind = content.pdfUrl ? "DOCUMENT" : "VIDEO"
    const provider = source.includes("drive.google.com") ? "DRIVE" : source.includes("youtube") || source.includes("youtu.be") ? "YOUTUBE" : "LEGACY"
    const encrypted = encryptSecret(source)
    await prisma.$transaction(async (tx) => {
      const asset = await tx.contentAsset.create({
        data: { contentId: content.id, kind, sourceProvider: provider, sourceRefEncrypted: encrypted, status: "MIGRATION_PENDING" },
      })
      await tx.ingestionJob.create({
        data: {
          requestedById: content.uploadedById,
          contentId: content.id,
          assetId: asset.id,
          sourceType: "LEGACY_MIGRATION",
          sourceRefEncrypted: encrypted,
          status: "REVIEW_REQUIRED",
          progressPercent: 10,
          instructions: "Verify rights, source privacy, malware scan, and secure delivery before enabling this asset.",
        },
      })
    })
    created += 1
  }
  console.log(`Created ${created} legacy migration job(s). No content was published or unpublished.`)
}

main().finally(() => prisma.$disconnect())
