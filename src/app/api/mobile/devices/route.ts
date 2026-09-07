import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const devices = await prisma.deviceSession.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      deviceId: true,
      platform: true,
      deviceName: true,
      attestedAt: true,
      lastSeenAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { lastSeenAt: "desc" },
  })
  return NextResponse.json({ devices }, { headers: { "Cache-Control": "no-store" } })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  const deviceSessionId = body && typeof body.deviceSessionId === "string" ? body.deviceSessionId : ""
  if (!deviceSessionId) return NextResponse.json({ error: "deviceSessionId requis" }, { status: 400 })

  const device = await prisma.deviceSession.findFirst({
    where: { id: deviceSessionId, userId: user.id },
    select: { id: true },
  })
  if (!device) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  await prisma.$transaction([
    prisma.deviceSession.update({ where: { id: device.id }, data: { revokedAt: now } }),
    prisma.refreshToken.updateMany({
      where: { deviceSessionId: device.id, revokedAt: null },
      data: { revokedAt: now },
    }),
  ])
  return NextResponse.json({ ok: true })
}
