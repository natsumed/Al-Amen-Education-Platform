import { prisma } from "@/lib/prisma"
import { processApprovedDocument, processContentIntake } from "@/lib/content-processing"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function processOne() {
  const intake = await prisma.contentIntake.findFirst({ where: { status: "RECEIVED" }, orderBy: { createdAt: "asc" }, select: { id: true } })
  if (intake) return processContentIntake(intake.id)
  const asset = await prisma.contentAsset.findFirst({ where: { status: "PENDING", kind: "DOCUMENT", sourceProvider: "DRIVE" }, orderBy: { createdAt: "asc" }, select: { id: true } })
  if (asset) return processApprovedDocument(asset.id)
  return false
}

async function main(): Promise<boolean> {
  if (process.env.CONTENT_WORKER_ENABLED === "false") {
    await sleep(30_000)
    return false
  }
  try {
    return await processOne()
  } catch (error) {
    console.error("content-worker failure", error instanceof Error ? error.message : error)
    await sleep(5_000)
    return false
  }
}

try {
  while (true) {
    const processed = await main()
    if (processed === false) await sleep(5_000)
  }
} finally {
  await prisma.$disconnect()
}
