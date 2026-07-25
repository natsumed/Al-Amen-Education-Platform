import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  updateProfileSchema,
  changePasswordSchema,
  registerSchema,
  parentLinkSchema,
} from "@/lib/validations"
import { whyUsefulForContent } from "@/lib/ai/content-hints"

describe("updateProfileSchema", () => {
  it("accepts profile preference fields", () => {
    const parsed = updateProfileSchema.safeParse({
      fullName: "Sara Ben Ali",
      phone: "+21620000000",
      avatarUrl: "/uploads/avatars/demo.jpg",
      preferredLanguage: "ar",
      emailNotifications: false,
    })
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid preferredLanguage", () => {
    const parsed = updateProfileSchema.safeParse({ preferredLanguage: "en" })
    expect(parsed.success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  it("requires matching confirmation", () => {
    const ok = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "newpass12",
      confirmPassword: "newpass12",
    })
    expect(ok.success).toBe(true)

    const bad = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "newpass12",
      confirmPassword: "otherpass",
    })
    expect(bad.success).toBe(false)
  })

  it("enforces min length on new password", () => {
    const short = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "short",
      confirmPassword: "short",
    })
    expect(short.success).toBe(false)
  })
})

describe("registerSchema parent studentPublicId", () => {
  const base = {
    fullName: "Parent Test",
    email: "parent@example.com",
    password: "password1",
  }

  it("requires 8-digit studentPublicId for PARENT", () => {
    expect(registerSchema.safeParse({ ...base, role: "PARENT" }).success).toBe(false)
    expect(
      registerSchema.safeParse({ ...base, role: "PARENT", studentPublicId: "123" }).success
    ).toBe(false)
    expect(
      registerSchema.safeParse({ ...base, role: "PARENT", studentPublicId: "10000003" }).success
    ).toBe(true)
  })

  it("does not require studentPublicId for STUDENT", () => {
    expect(registerSchema.safeParse({ ...base, role: "STUDENT" }).success).toBe(true)
  })
})

describe("parentLinkSchema", () => {
  it("accepts childIdentifier (email or publicId) or legacy childEmail", () => {
    expect(parentLinkSchema.safeParse({ childIdentifier: "10000003" }).success).toBe(true)
    expect(parentLinkSchema.safeParse({ childIdentifier: "a@b.com" }).success).toBe(true)
    expect(parentLinkSchema.safeParse({ childEmail: "a@b.com" }).success).toBe(true)
    expect(parentLinkSchema.safeParse({}).success).toBe(false)
  })
})

describe("whyUsefulForContent", () => {
  it("builds a French pedagogical hint", () => {
    const hint = whyUsefulForContent({
      grade: "GRADE_4",
      subject: "MATH",
      contentType: "COURSE",
      isFree: true,
      lang: "fr",
    })
    expect(hint).toMatch(/MATH|Math|math/i)
    expect(hint).toMatch(/accès libre/)
  })

  it("builds an Arabic pedagogical hint", () => {
    const hint = whyUsefulForContent({
      grade: "GRADE_3",
      subject: "ARABIC",
      contentType: "BOOK",
      isFree: false,
      lang: "ar",
    })
    expect(hint).toMatch(/مجاني|اشتراك/)
    expect(hint.length).toBeGreaterThan(20)
  })
})

describe("POST /api/users/me/password (wrong current password)", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns 400 when current password does not match", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn(async () => ({ user: { id: "u1" } })),
    }))
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        user: {
          findUnique: vi.fn(async () => ({
            id: "u1",
            passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oYwKxqKxqKxqK",
          })),
          update: vi.fn(),
        },
      },
    }))
    vi.doMock("bcryptjs", () => ({
      default: {
        compare: vi.fn(async () => false),
        hash: vi.fn(async () => "newhash"),
      },
    }))

    const { POST } = await import("@/app/api/users/me/password/route")
    const req = new Request("http://localhost/api/users/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "wrong-password",
        newPassword: "newpass12",
        confirmPassword: "newpass12",
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(String(body.error)).toMatch(/actuel|current|incorrect|mot de passe/i)
  })
})
