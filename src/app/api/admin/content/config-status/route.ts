import { NextRequest, NextResponse } from "next/server"
import { getRequestUser } from "@/lib/request-auth"
import { driveConfigured } from "@/lib/drive"

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const checks = {
    drive: driveConfigured(),
    openai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "EMPTY"),
    malwareScanner: process.env.CONTENT_SCAN_REQUIRED === "false" || Boolean(process.env.CLAMSCAN_BIN || "clamscan"),
    documentTools: Boolean(process.env.PDFTOPPM_BIN || process.env.PDFTOTEXT_BIN || "pdftoppm"),
    privateStorage: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    workerEnabled: process.env.CONTENT_WORKER_ENABLED !== "false",
  }
  return NextResponse.json({ checks, ready: Object.values(checks).every(Boolean) }, { headers: { "Cache-Control": "private, no-store" } })
}
