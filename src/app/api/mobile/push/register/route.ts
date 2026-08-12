import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS })

  const body = await req.json().catch(() => ({}))
  const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken : null
  if (!expoPushToken) {
    return NextResponse.json({ error: "expoPushToken requis" }, { status: 400, headers: CORS })
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

  return NextResponse.json({ ok: true }, { headers: CORS })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS })

  const body = await req.json().catch(() => ({}))
  const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken : null
  if (expoPushToken) {
    await prisma.deviceToken.deleteMany({ where: { token: expoPushToken, userId: user.id } })
  }

  return NextResponse.json({ ok: true }, { headers: CORS })
}
