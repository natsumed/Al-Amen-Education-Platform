import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user?.id || user.role !== "PARENT") {
    return NextResponse.json({ links: [] })
  }

  const links = await prisma.parentLink.findMany({
    where: { parentId: user.id },
    include: {
      student: {
        select: {
          id: true,
          publicId: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          progress: {
            orderBy: { lastAccessed: "desc" },
            take: 10,
            select: {
              id: true,
              progressPercent: true,
              completed: true,
              lastAccessed: true,
              content: { select: { id: true, titleFr: true, titleAr: true } },
            },
          },
        },
      },
    },
  })
  return NextResponse.json({ links }, { headers: { "Cache-Control": "private, no-store" } })
}
