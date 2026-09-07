import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken : null
  if (!expoPushToken) {
    return NextResponse.json({ error: "expoPushToken requis" }, { status: 400 })
  }

  await prisma.deviceToken.upsert({
    where: { token: expoPushToken },
    update: { userId: user.id, platform: typeof body.platform === "string" ? body.platform : null },
    create: {
      token: expoPushToken,
      userId: user.id,
      platform: typeof body.platform === "string" ? body.platform : null,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken : null
  if (expoPushToken) {
    await prisma.deviceToken.deleteMany({ where: { token: expoPushToken, userId: user.id } })
  }

  return NextResponse.json({ ok: true })
}
