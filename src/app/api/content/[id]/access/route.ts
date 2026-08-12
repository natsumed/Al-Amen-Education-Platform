import { NextRequest, NextResponse } from "next/server"
import { getContentAccessInfo } from "@/lib/access-control"
import { getRequestUser } from "@/lib/request-auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req)
  const access = await getContentAccessInfo(user?.id || null, user?.role || null, params.id)
  return NextResponse.json(access)
}
