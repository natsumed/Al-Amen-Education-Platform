import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user?.id || user.role !== "PARENT") {
    return NextResponse.json({ links: [] }, { headers: corsHeaders })
  }

  const links = await prisma.parentLink.findMany({
    where: { parentId: user.id },
    include: {
      student: {
        select: { id: true, publicId: true, fullName: true, email: true, avatarUrl: true },
      },
    },
  })
  return NextResponse.json({ links }, { headers: corsHeaders })
}
