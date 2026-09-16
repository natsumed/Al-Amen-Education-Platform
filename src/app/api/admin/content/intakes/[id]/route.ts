import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

const updateSchema = z.object({
  titleAr: z.string().min(2).max(180).optional(),
  titleFr: z.string().min(2).max(180).optional(),
  titleEn: z.string().min(2).max(180).nullable().optional(),
  grade: z.enum(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"]).optional(),
  subject: z.enum(["ARABIC", "FRENCH", "MATH", "SCIENCE", "ISLAMIC", "HISTORY", "CIVIC", "ARTS", "ENGLISH"]).optional(),
  category: z.enum(["STORYBOOK", "STUDENT_WORKBOOK", "TEACHER_RESOURCE", "INTERNAL_PRODUCTION", "REVIEW_REQUIRED"]).optional(),
  audience: z.enum(["LEARNER", "TEACHER", "INTERNAL"]).optional(),
  language: z.enum(["AR", "FR", "EN", "MULTI"]).optional(),
  collectionKey: z.string().trim().max(80).nullable().optional(),
  storyKey: z.string().trim().max(80).nullable().optional(),
  editionLabel: z.string().trim().max(80).nullable().optional(),
  reviewNotes: z.string().max(4_000).nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid intake metadata" }, { status: 400 })
  const intake = await prisma.contentIntake.update({ where: { id }, data: parsed.data })
  await prisma.auditEvent.create({ data: { userId: user.id, action: "CONTENT_INTAKE_METADATA_UPDATED", targetType: "ContentIntake", targetId: id } })
  return NextResponse.json({ intake: { ...intake, sourceRefEncrypted: undefined, sizeBytes: intake.sizeBytes?.toString() } }, { headers: { "Cache-Control": "private, no-store" } })
}
