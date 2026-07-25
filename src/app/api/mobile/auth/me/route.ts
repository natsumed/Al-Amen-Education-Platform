import { NextRequest, NextResponse } from "next/server"
import { getRequestUser } from "@/lib/request-auth"
import { prisma } from "@/lib/prisma"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getRequestUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        publicId: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        subscriptions: {
          where: { status: "ACTIVE", endDate: { gt: new Date() } },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders })
    }

    return NextResponse.json({ user }, { headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500, headers: corsHeaders })
  }
}
