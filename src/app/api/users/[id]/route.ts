import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const user = await prisma.user.update({ where: { id: params.id }, data: body })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (session.user.role !== "ADMIN" && session.user.id !== params.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { subscriptions: true, progress: { include: { content: true }, take: 10, orderBy: { lastAccessed: "desc" } } },
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
