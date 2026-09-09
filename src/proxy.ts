import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

function buildContentSecurityPolicy(nonce: string) {
  const legacyFrames = process.env.ALLOW_LEGACY_MEDIA === "true"
    ? " https://www.youtube.com https://drive.google.com"
    : ""

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `frame-src 'self' https://player.vdocipher.com${legacyFrames}`,
    "connect-src 'self' https://*.supabase.co https://*.vdocipher.com",
    "media-src 'self' blob: https://*.vdocipher.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https:",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")
}

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Get token without Prisma - Edge Runtime compatible
  // Auth.js uses the __Secure- cookie name on HTTPS. The proxy runs
  // independently of the auth handler, so it must make the same choice or it
  // will miss a valid production session and redirect every dashboard request
  // back to /login.
  const secureCookie =
    nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https"
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  })
  
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-nonce", nonce)
  // Next.js reads the incoming CSP to attach this nonce to framework and
  // page scripts. The same policy is then returned to the browser.
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy)
  const secureNext = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set("Content-Security-Policy", contentSecurityPolicy)
    return response
  }

  const isLoggedIn = !!token
  const userRole = token?.role as string | undefined
  const mfaEnrollmentRequired = token?.mfaEnrollmentRequired === true

  if (isLoggedIn && userRole === "PENDING") {
    const allowed = pathname === "/auth/onboarding" || pathname.startsWith("/api/auth/onboarding") || pathname.startsWith("/api/security/mfa") || pathname.startsWith("/api/auth/")
    if (!allowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Onboarding required", code: "ONBOARDING_REQUIRED" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/auth/onboarding", nextUrl))
    }
  }

  if (isLoggedIn && mfaEnrollmentRequired) {
    const allowed = pathname === "/settings" || pathname.startsWith("/api/security/mfa") || pathname.startsWith("/api/auth/") || pathname === "/api/users/me"
    if (!allowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "MFA enrollment required", code: "MFA_ENROLLMENT_REQUIRED" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/settings?tab=security&mfa=required", nextUrl))
    }
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin",
      TEACHER: "/teacher",
      STUDENT: "/student",
      PARENT: "/parent",
    }
    return NextResponse.redirect(
      new URL(userRole === "PENDING" ? "/auth/onboarding" : (dashboardMap[userRole ?? "STUDENT"] ?? "/student"), nextUrl)
    )
  }

  // Protect dashboard routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl))
    if (userRole !== "ADMIN") return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (pathname.startsWith("/teacher")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl))
    if (userRole !== "TEACHER") return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (pathname.startsWith("/student")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl))
    if (userRole !== "STUDENT") return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (pathname.startsWith("/parent")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl))
    if (userRole !== "PARENT") return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Protect checkout and profile
  if (pathname.startsWith("/checkout") || pathname.startsWith("/profile")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return secureNext()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|downloads/).*)",
  ],
}
