import { NextRequest, NextResponse } from "next/server"
import { loginLimiter } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) return NextResponse.json({ blocked: false, remaining: 5 })

  const result = loginLimiter.check(email)
  return NextResponse.json({
    blocked: !result.allowed,
    remaining: result.remaining,
  })
}
