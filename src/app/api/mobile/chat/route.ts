import { NextRequest, NextResponse } from "next/server"
import { getRequestUser } from "@/lib/request-auth"
import { smartOfflineReply } from "@/lib/ai/smart-offline-agent"

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role === "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    message?: string
    language?: "fr" | "ar"
  }
  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 })
  }

  const result = await smartOfflineReply(message, {
    userId: user.id,
    role: user.role,
    lang: body.language === "ar" ? "ar" : "fr",
  })
  return NextResponse.json({ reply: result.text, mode: "smart-offline" })
}
