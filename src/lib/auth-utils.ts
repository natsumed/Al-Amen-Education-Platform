import { auth } from "./auth"
import { prisma } from "./prisma"
import type { Role } from "@/types"

export async function getSession() {
  return await auth()
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  })

  return user
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireRole(role: Role | Role[]) {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(session.user.role as Role)) {
    throw new Error("Forbidden")
  }
  return session
}

export async function requireAdmin() {
  return requireRole("ADMIN")
}

export function hasRole(userRole: string, requiredRole: Role | Role[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(userRole as Role)
}

export async function getActiveSubscription(userId: string) {
  const now = new Date()
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: now },
    },
    orderBy: { endDate: "desc" },
  })

  if (!sub) return null

  // Auto-expire if past end date
  if (sub.endDate < now) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    })
    return null
  }

  return sub
}

export async function isPaidUser(userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(userId)
  return sub !== null && sub.plan !== "FREE"
}
