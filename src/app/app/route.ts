import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // The request URL inside the container can contain the private Docker
  // hostname. Always build first-party redirects from the configured public
  // origin so /app never sends users to an internal service address.
  const publicOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://amanallahedition.com"
  const userAgent = req.headers.get("user-agent") || ""
  const isAndroid = /android/i.test(userAgent)
  const isApple = /iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && /mobile/i.test(userAgent))
  const platform = isAndroid ? "ANDROID" : isApple ? "IOS" : null

  if (!platform) return NextResponse.redirect(new URL("/download", publicOrigin), 302)
  const release = await prisma.mobileRelease.findFirst({
    where: { platform, isPublished: true },
    orderBy: [{ buildNumber: "desc" }, { createdAt: "desc" }],
    select: { url: true, appStoreUrl: true },
  }).catch(() => null)
  const target = platform === "ANDROID" ? release?.url : release?.appStoreUrl
  if (!target) return NextResponse.redirect(new URL(`/download?platform=${platform.toLowerCase()}`, publicOrigin), 302)
  return NextResponse.redirect(new URL(target, publicOrigin), 302)
}
