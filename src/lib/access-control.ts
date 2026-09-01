import { prisma } from "./prisma"
import type { Content, User } from "@/types"

export async function canAccessContent(
  userId: string,
  userRole: string,
  content: Pick<Content, "id" | "isFree">
): Promise<boolean> {
  // Parents never consume courses — monitoring + payment only
  if (userRole === "PARENT") return false

  // Free content is accessible to everyone (except parents)
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
  if (userRole === "PARENT") return false
  // Keep source media view-only for customers. Admins can still download for
  // moderation and content-management purposes.
  if (userRole === "ADMIN") return true
  return false
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

  // Parents: monitoring only — no course access
  if (userRole === "PARENT") {
    return { canAccess: false, canDownload: false, isSubscribed: false }
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
