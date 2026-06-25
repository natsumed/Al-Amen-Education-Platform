import { z } from "zod"

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["STUDENT", "TEACHER", "PARENT"]).default("STUDENT"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
})

export const createContentSchema = z.object({
  titleAr: z.string().min(2, "Arabic title required"),
  titleFr: z.string().min(2, "French title required"),
  descriptionAr: z.string().optional(),
  descriptionFr: z.string().optional(),
  grade: z.enum(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"]),
  subject: z.enum(["ARABIC", "FRENCH", "MATH", "SCIENCE", "ISLAMIC", "HISTORY", "CIVIC", "ARTS", "ENGLISH"]),
  contentType: z.enum(["COURSE", "BOOK", "SERIES", "ANIMATION"]),
  isFree: z.boolean().default(true),
  price: z.number().min(0).optional(),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["PUBLISHED", "DRAFT"]).default("PUBLISHED"),
})

export const updateContentSchema = createContentSchema.partial()

export const createPaymentSchema = z.object({
  itemType: z.enum(["SUBSCRIPTION", "CONTENT"]),
  itemId: z.string().optional(),
  plan: z.enum(["FREE", "STUDENT_MONTHLY", "STUDENT_YEARLY", "TEACHER_MONTHLY", "TEACHER_YEARLY"]).optional(),
  provider: z.enum(["KONNECT", "FLOUCI", "MANUAL"]),
})

export const manualActivationSchema = z.object({
  targetUserId: z.string().min(1, "User ID required"),
  plan: z.enum(["STUDENT_MONTHLY", "STUDENT_YEARLY", "TEACHER_MONTHLY", "TEACHER_YEARLY"]),
  durationDays: z.number().min(1).max(365),
  reason: z.string().optional(),
})

export const parentLinkSchema = z.object({
  childEmail: z.string().email("Invalid email address"),
})

export const progressSchema = z.object({
  contentId: z.string().min(1),
  progressPercent: z.number().min(0).max(100),
})

export const reviewSchema = z.object({
  contentId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const contentFiltersSchema = z.object({
  grade: z.enum(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5", "GRADE_6"]).optional(),
  subject: z.enum(["ARABIC", "FRENCH", "MATH", "SCIENCE", "ISLAMIC", "HISTORY", "CIVIC", "ARTS", "ENGLISH"]).optional(),
  contentType: z.enum(["COURSE", "BOOK", "SERIES", "ANIMATION"]).optional(),
  isFree: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "STUDENT", "TEACHER", "PARENT"]),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateContentInput = z.infer<typeof createContentSchema>
export type ManualActivationInput = z.infer<typeof manualActivationSchema>
export type ParentLinkInput = z.infer<typeof parentLinkSchema>
export type ProgressInput = z.infer<typeof progressSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
