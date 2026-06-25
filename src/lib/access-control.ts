import { prisma } from "./prisma"
import type { Content, User } from "@/types"

export async function canAccessContent(
  userId: string,
  userRole: string,
  content: Pick<Content, "id" | "isFree">
): Promise<boolean> {
  // Free content is accessible to everyone
  if (content.isFree) return true

  // Admins always have access
  if (userRole === "ADMIN") return true

  // Check for active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
      plan: { not: "FREE" },
    },
  })

  if (subscription) return true

  // Check for one-time purchase
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_contentId: { userId, contentId: content.id },
    },
  })

  return purchase !== null
}

export async function canDownload(
  userId: string,
  userRole: string,
  content: Pick<Content, "id" | "isFree">
): Promise<boolean> {
  // Admins always can download
  if (userRole === "ADMIN") return true

  // Downloads require an active subscription (not just one-time purchase)
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
      plan: { not: "FREE" },
    },
  })

  return subscription !== null
}

export async function getContentAccessInfo(
  userId: string | null,
  userRole: string | null,
  contentId: string
): Promise<{
  canAccess: boolean
  canDownload: boolean
  isSubscribed: boolean
}> {
  if (!userId || !userRole) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { isFree: true },
    })
    if (!content) return { canAccess: false, canDownload: false, isSubscribed: false }
    return {
      canAccess: content.isFree,
      canDownload: false,
      isSubscribed: false,
    }
  }

  if (userRole === "ADMIN") {
    return { canAccess: true, canDownload: true, isSubscribed: true }
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { isFree: true, id: true },
  })

  if (!content) return { canAccess: false, canDownload: false, isSubscribed: false }

  if (content.isFree) {
    // Check if subscribed for download
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endDate: { gt: new Date() },
        plan: { not: "FREE" },
      },
    })
    return {
      canAccess: true,
      canDownload: sub !== null,
      isSubscribed: sub !== null,
    }
  }

  // Paid content: check subscription
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
      plan: { not: "FREE" },
    },
  })

  if (sub) {
    return { canAccess: true, canDownload: true, isSubscribed: true }
  }

  // Check one-time purchase (view only, no download)
  const purchase = await prisma.purchase.findUnique({
    where: { userId_contentId: { userId, contentId: content.id } },
  })

  return {
    canAccess: purchase !== null,
    canDownload: false,
    isSubscribed: false,
  }
}
