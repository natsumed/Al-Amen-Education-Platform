import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const intake = await prisma.contentIntake.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!intake) return NextResponse.json({ error: "Intake not found" }, { status: 404 })
  if (!["FAILED", "WAITING_FOR_SCAN"].includes(intake.status)) return NextResponse.json({ error: "Only failed or scan-blocked intakes can be retried" }, { status: 409 })
  const updated = await prisma.contentIntake.update({ where: { id }, data: { status: "RECEIVED", errorCode: null, errorMessage: null } })
  await prisma.auditEvent.create({ data: { userId: user.id, action: "CONTENT_INTAKE_RETRY_REQUESTED", targetType: "ContentIntake", targetId: id } })
  return NextResponse.json({ intake: { id: updated.id, status: updated.status } }, { headers: { "Cache-Control": "private, no-store" } })
}
