import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getContentAccessInfo } from "@/lib/access-control"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  const access = await getContentAccessInfo(session?.user?.id || null, session?.user?.role || null, params.id)
  return NextResponse.json(access)
}
