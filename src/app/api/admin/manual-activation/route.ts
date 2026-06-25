import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { manualActivationSchema } from "@/lib/validations"
import { manualActivateSubscription } from "@/lib/payment"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const parsed = manualActivationSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const result = await manualActivateSubscription(session.user.id, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { prisma } = await import("@/lib/prisma")
    const logs = await prisma.manualActivationLog.findMany({
      include: { admin: { select: { fullName: true } }, targetUser: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
