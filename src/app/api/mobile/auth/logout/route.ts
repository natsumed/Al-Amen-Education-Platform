import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req, { allowPending: true })
  if (!user?.deviceSessionId) return NextResponse.json({ ok: true })

  const now = new Date()
  await prisma.$transaction([
    prisma.deviceSession.update({
      where: { id: user.deviceSessionId },
      data: { revokedAt: now },
    }),
    prisma.refreshToken.updateMany({
      where: { deviceSessionId: user.deviceSessionId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ])
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
}
