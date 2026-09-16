import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

const schema = z.object({ coverIntakeId: z.string().uuid() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid cover intake" }, { status: 400 })
  const [intake, cover] = await prisma.$transaction([
    prisma.contentIntake.findUnique({ where: { id } }),
    prisma.contentIntake.findUnique({ where: { id: parsed.data.coverIntakeId } }),
  ])
  if (!intake || !cover) return NextResponse.json({ error: "Intake not found" }, { status: 404 })
  if (cover.category !== "INTERNAL_PRODUCTION" || !/cover|غلاف/i.test(`${cover.sourceFileName} ${cover.sourceFolder || ""}`)) {
    return NextResponse.json({ error: "Selected intake is not classified as a cover" }, { status: 422 })
  }
  const [updated, updatedCover] = await prisma.$transaction([
    prisma.contentIntake.update({ where: { id }, data: { coverRelationship: cover.id } }),
    prisma.contentIntake.update({ where: { id: cover.id }, data: { coverRelationship: intake.id } }),
    prisma.auditEvent.create({ data: { userId: user.id, action: "CONTENT_INTAKE_COVER_LINKED", targetType: "ContentIntake", targetId: id, metadata: { coverIntakeId: cover.id } } }),
  ]).then((results) => [results[0], results[1]] as const)
  return NextResponse.json({ intake: { id: updated.id, coverRelationship: updated.coverRelationship }, cover: { id: updatedCover.id, coverRelationship: updatedCover.coverRelationship } }, { headers: { "Cache-Control": "private, no-store" } })
}
