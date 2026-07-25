import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getBearerToken, verifyMobileToken } from "@/lib/mobile-auth"
import type { Role } from "@/types"

export type AuthUser = {
  id: string
  email: string
  role: Role
  fullName: string
}

/**
 * Resolve the current user from NextAuth session OR mobile Bearer token.
 * Use in API routes that must work for both web and Android.
 */
export async function getRequestUser(req?: NextRequest): Promise<AuthUser | null> {
  const session = await auth()
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      role: session.user.role,
      fullName: session.user.fullName,
    }
  }

  if (!req) return null

  const token = getBearerToken(req.headers.get("authorization"))
  if (!token) return null

  const payload = verifyMobileToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, fullName: true, isBanned: true },
  })

  if (!user || user.isBanned) return null

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    fullName: user.fullName,
  }
}
