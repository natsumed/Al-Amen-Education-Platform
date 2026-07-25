import { prisma } from "./prisma"

/** Generate a unique 8-digit public account ID (10000000–99999999). */
export async function generatePublicId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const n = Math.floor(10000000 + Math.random() * 90000000)
    const publicId = String(n)
    const existing = await prisma.user.findUnique({ where: { publicId }, select: { id: true } })
    if (!existing) return publicId
  }
  throw new Error("Unable to generate unique publicId")
}

/**
 * Resolve a user by UUID, 8-digit publicId, or email.
 * Used by admin manual activation and lookups.
 */
export async function resolveUserByIdentifier(identifier: string) {
  const raw = identifier.trim()
  if (!raw) return null

  // 8-digit public ID
  if (/^\d{8}$/.test(raw)) {
    return prisma.user.findUnique({
      where: { publicId: raw },
      select: { id: true, email: true, fullName: true, role: true, publicId: true },
    })
  }

  // Email
  if (raw.includes("@")) {
    return prisma.user.findUnique({
      where: { email: raw.toLowerCase() },
      select: { id: true, email: true, fullName: true, role: true, publicId: true },
    })
  }

  // Internal UUID
  return prisma.user.findUnique({
    where: { id: raw },
    select: { id: true, email: true, fullName: true, role: true, publicId: true },
  })
}
