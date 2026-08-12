import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ subscription: null })

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE", endDate: { gt: new Date() } },
      orderBy: { endDate: "desc" },
    })

    return NextResponse.json({ subscription })
  } catch {
    return NextResponse.json({ subscription: null })
  }
}
