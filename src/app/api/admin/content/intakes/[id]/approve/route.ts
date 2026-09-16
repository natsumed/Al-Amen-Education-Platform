import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const intake = await prisma.contentIntake.findUnique({ where: { id } })
  if (!intake || intake.status !== "REVIEW_REQUIRED") return NextResponse.json({ error: "Intake is not ready for approval" }, { status: 409 })
  if (!intake.sourceRefEncrypted || !intake.titleAr || !intake.titleFr || !intake.grade || !intake.subject || !intake.category || !intake.audience || !intake.language) {
    return NextResponse.json({ error: "Complete title, language, category, audience, subject, and grade before approval" }, { status: 422 })
  }
  if (intake.category === "INTERNAL_PRODUCTION" || intake.category === "REVIEW_REQUIRED") {
    return NextResponse.json({ error: "This item must remain internal or be reclassified before approval" }, { status: 422 })
  }
  const titleAr = intake.titleAr
  const titleFr = intake.titleFr
  const grade = intake.grade
  const subject = intake.subject
  const category = intake.category
  const audience = intake.audience
  const language = intake.language

  const result = await prisma.$transaction(async (tx) => {
    const content = await tx.content.create({
      data: {
        titleAr,
        titleFr,
        titleEn: intake.titleEn,
        grade,
        subject,
        contentType: category === "STORYBOOK" ? "BOOK" : "BOOK",
        language,
        audience,
        collectionKey: intake.collectionKey,
        storyKey: intake.storyKey,
        editionLabel: intake.editionLabel,
        isFree: false,
        status: "DRAFT",
        uploadedById: user.id,
      },
    })
    const asset = await tx.contentAsset.create({
      data: {
        contentId: content.id,
        kind: "DOCUMENT",
        sourceProvider: "DRIVE",
        sourceRefEncrypted: intake.sourceRefEncrypted,
        sourceFileIdHash: intake.sourceFileIdHash,
        sourceFileName: intake.sourceFileName,
        locale: intake.language,
        assetRole: "PRIMARY",
        status: "PENDING",
      },
    })
    const updated = await tx.contentIntake.update({ where: { id }, data: { status: "APPROVED_QUEUED", reviewedById: user.id, approvedAt: new Date() } })
    await tx.auditEvent.create({ data: { userId: user.id, action: "CONTENT_INTAKE_APPROVED", targetType: "ContentIntake", targetId: id, metadata: { contentId: content.id, assetId: asset.id } } })
    return { content, asset, intake: updated }
  })
  return NextResponse.json({
    content: result.content,
    asset: { id: result.asset.id, status: result.asset.status, kind: result.asset.kind },
    intake: { id: result.intake.id, status: result.intake.status, sizeBytes: result.intake.sizeBytes?.toString() },
  }, { headers: { "Cache-Control": "private, no-store" } })
}
