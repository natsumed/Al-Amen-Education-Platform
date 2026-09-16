import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

const schema = z.object({ reason: z.string().trim().min(3).max(4_000) })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 })
  const intake = await prisma.contentIntake.update({
    where: { id },
    data: { status: "REJECTED", reviewNotes: parsed.data.reason, reviewedById: user.id },
  })
  await prisma.auditEvent.create({ data: { userId: user.id, action: "CONTENT_INTAKE_REJECTED", targetType: "ContentIntake", targetId: id, metadata: { reason: parsed.data.reason } } })
  return NextResponse.json({ intake: { id: intake.id, status: intake.status, reviewNotes: intake.reviewNotes } }, { headers: { "Cache-Control": "private, no-store" } })
}
