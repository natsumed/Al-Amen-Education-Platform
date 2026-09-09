import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { getRequestUser } from "@/lib/request-auth"
import { verifyDocumentGrant } from "@/lib/document-access"
import { downloadPrivateBuffer } from "@/lib/storage"
import { hasNativeContentSession } from "@/lib/native-content"

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char] || char))
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; page: string }> }) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await hasNativeContentSession(req, user))) return NextResponse.json({ error: "Protected content requires the Amenallah app", code: "NATIVE_APP_REQUIRED" }, { status: 403 })
  const { id, page: pageParam } = await params
  const page = Number(pageParam)
  const token = new URL(req.url).searchParams.get("token") || ""
  const grant = await verifyDocumentGrant(token)
  if (!grant || grant.userId !== user.id || grant.contentId !== id || !grant.pages.includes(page)) {
    return NextResponse.json({ error: "Invalid or expired page authorization" }, { status: 403 })
  }
  const asset = await prisma.contentAsset.findFirst({
    where: { id: grant.assetId, contentId: id, kind: "DOCUMENT", status: "READY", deliveryProvider: "SUPABASE_TILES" },
    select: { id: true },
  })
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const source = await downloadPrivateBuffer(`document-pages/${asset.id}/${page}.webp`)
  if (!source) return NextResponse.json({ error: "Page unavailable" }, { status: 404 })
  const mark = escapeXml(`${user.id.slice(0, 8)} · ${new Date().toISOString().slice(0, 16)}`)
  const metadata = await sharp(source).metadata()
  const width = metadata.width || 1200
  const height = metadata.height || 1600
  const watermark = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" transform="rotate(-28 ${width / 2} ${height / 2})" fill="rgba(60,60,60,0.22)" font-size="${Math.max(22, Math.round(width / 28))}" font-family="sans-serif">${mark}</text></svg>`)
  const rendered = await sharp(source).composite([{ input: watermark }]).webp({ quality: 82 }).toBuffer()
  return new NextResponse(new Uint8Array(rendered), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noindex, noarchive",
    },
  })
}
