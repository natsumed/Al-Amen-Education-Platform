import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { contentProposalSchema } from "@/lib/ai/content-ingestion"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const job = await prisma.ingestionJob.findUnique({ where: { id } })
  if (!job || job.status !== "REVIEW_REQUIRED") {
    return NextResponse.json({ error: "Cette proposition n'est pas prête à être approuvée" }, { status: 409 })
  }
  const proposal = contentProposalSchema.safeParse(job.proposal)
  if (!proposal.success) return NextResponse.json({ error: "Proposition AI invalide" }, { status: 422 })

  const kind = proposal.data.contentType === "BOOK" ? "DOCUMENT" : "VIDEO"
  const result = await prisma.$transaction(async (tx) => {
    const content = await tx.content.create({
      data: {
        titleAr: proposal.data.titleAr,
        titleFr: proposal.data.titleFr,
        descriptionAr: proposal.data.descriptionAr,
        descriptionFr: proposal.data.descriptionFr,
        grade: proposal.data.grade,
        subject: proposal.data.subject,
        contentType: proposal.data.contentType,
        isFree: false,
        status: "DRAFT",
        uploadedById: user.id,
      },
    })
    const asset = await tx.contentAsset.create({
      data: {
        contentId: content.id,
        kind,
        sourceProvider: "DRIVE",
        sourceRefEncrypted: job.sourceRefEncrypted,
        status: "PENDING",
      },
    })
    const updatedJob = await tx.ingestionJob.update({
      where: { id: job.id },
      data: {
        reviewedById: user.id,
        approvedAt: new Date(),
        contentId: content.id,
        assetId: asset.id,
        status: "APPROVED_QUEUED",
        progressPercent: 50,
      },
    })
    await tx.auditEvent.create({
      data: {
        userId: user.id,
        action: "AI_INGESTION_APPROVED",
        targetType: "IngestionJob",
        targetId: job.id,
        metadata: { contentId: content.id, assetId: asset.id },
      },
    })
    return { content, asset, job: updatedJob }
  })

  return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } })
}
