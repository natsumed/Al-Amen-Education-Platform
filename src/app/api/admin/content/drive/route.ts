import { NextRequest, NextResponse } from "next/server"
import { getRequestUser } from "@/lib/request-auth"
import { driveConfigured, listDriveLibrary } from "@/lib/drive"

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (!driveConfigured()) return NextResponse.json({ configured: false, entries: [] }, { headers: { "Cache-Control": "private, no-store" } })
  try {
    const entries = await listDriveLibrary()
    return NextResponse.json({ configured: true, entries: entries.map(({ id, name, relativePath, mimeType, kind }) => ({ id, name, relativePath, mimeType, kind })) }, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ error: "Drive privé indisponible" }, { status: 502 })
  }
}
