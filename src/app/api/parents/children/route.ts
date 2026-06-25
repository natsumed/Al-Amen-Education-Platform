import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "PARENT") return NextResponse.json({ links: [] })

  const links = await prisma.parentLink.findMany({
    where: { parentId: session.user.id },
    include: { student: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
  })
  return NextResponse.json({ links })
}
