import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ subscription: null })

    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE", endDate: { gt: new Date() } },
      orderBy: { endDate: "desc" },
    })

    return NextResponse.json({ subscription })
  } catch {
    return NextResponse.json({ subscription: null })
  }
}
