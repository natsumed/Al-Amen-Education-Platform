import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Get token without Prisma - Edge Runtime compatible
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  
  const isLoggedIn = !!token
  const userRole = token?.role as string | undefined

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    const dashboardMap: Record<string, string> = {
      ADMIN: "/admin",
      TEACHER: "/teacher",
      STUDENT: "/student",
      PARENT: "/parent",
    }
    return NextResponse.redirect(
      new URL(dashboardMap[userRole ?? "STUDENT"] ?? "/student", nextUrl)
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/checkout/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/api/admin/:path*",
    "/login",
    "/register",
  ],
}
