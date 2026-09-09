import { NextRequest, NextResponse } from "next/server"

function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!domain) return null
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2)
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}@${domain}`
}

export async function GET(req: NextRequest) {
  const encoded = req.cookies.get("amenallah_pending_verification")?.value
  if (!encoded) return NextResponse.json({ pending: false })
  try {
    const email = Buffer.from(encoded, "base64url").toString("utf8").trim().toLowerCase()
    const maskedEmail = maskEmail(email)
    if (!maskedEmail) return NextResponse.json({ pending: false })
    return NextResponse.json({ pending: true, maskedEmail }, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ pending: false })
  }
}
