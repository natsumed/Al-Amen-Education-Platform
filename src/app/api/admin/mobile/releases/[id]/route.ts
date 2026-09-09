import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  const publish = body?.isPublished === true
  const release = await prisma.mobileRelease.update({ where: { id }, data: { isPublished: publish, publishedAt: publish ? new Date() : null, releasedAt: publish ? new Date() : undefined } })
  return NextResponse.json({ ...release, sizeBytes: release.sizeBytes?.toString() || null })
}
