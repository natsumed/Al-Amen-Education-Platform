import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || ""
  const isAndroid = /android/i.test(userAgent)
  const isApple = /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && /mobile/i.test(userAgent))
  const platform = isAndroid ? "ANDROID" : isApple ? "IOS" : null

  if (!platform) return NextResponse.redirect(new URL("/download", req.url), 302)
  const release = await prisma.mobileRelease.findFirst({
    where: { platform, isPublished: true },
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    select: { url: true, appStoreUrl: true },
  }).catch(() => null)
  const target = platform === "ANDROID" ? release?.url : release?.appStoreUrl
  if (!target) return NextResponse.redirect(new URL(`/download?platform=${platform.toLowerCase()}`, req.url), 302)
  return NextResponse.redirect(new URL(target, req.url), 302)
}
