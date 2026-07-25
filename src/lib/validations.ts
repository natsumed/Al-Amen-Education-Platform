import { z } from "zod"

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    // Teachers are allowed to self-register; parents monitor only; students learn
    role: z.enum(["STUDENT", "TEACHER", "PARENT"]).default("STUDENT"),
    /** Required when role is PARENT — student's 8-digit publicId */
    studentPublicId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "PARENT") {
      if (!data.studentPublicId || !/^\d{8}$/.test(data.studentPublicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "N° compte élève (8 chiffres) requis",
          path: ["studentPublicId"],
        })
      }
    }
  })

const optionalUrl = z.string().url().optional().or(z.literal(""))

export const adminUpdateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "STUDENT", "TEACHER", "PARENT"]).optional(),
  isBanned: z.boolean().optional(),
  avatarUrl: optionalUrl.optional().nullable(),
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
  phone: z.string().optional().nullable(),
  /** Absolute URL or site-relative path (e.g. /uploads/avatars/…) */
  avatarUrl: z
    .string()
    .refine(
      (v) =>
        v === "" ||
        v.startsWith("/uploads/") ||
        /^https?:\/\//i.test(v),
      "URL ou chemin d'avatar invalide"
    )
    .optional()
    .nullable(),
  preferredLanguage: z.enum(["fr", "ar"]).optional().nullable(),
  emailNotifications: z.boolean().optional(),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
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
  thumbnailUrl: optionalUrl,
  /** YouTube or Drive video link (Drive links normalized at serve time) */
  youtubeUrl: optionalUrl,
  /** PDF / book — Drive share link or direct URL (filled when Drive is ready) */
  pdfUrl: optionalUrl,
  /** Animated story — Drive / GIF / WebM URL */
  gifUrl: optionalUrl,
  status: z.enum(["PUBLISHED", "DRAFT"]).default("PUBLISHED"),
})

export const parentLinkRespondSchema = z.object({
  linkId: z.string().min(1),
  action: z.enum(["ACCEPT", "REJECT"]),
})

export const updateContentSchema = createContentSchema.partial()

export const createPaymentSchema = z.object({
  itemType: z.enum(["SUBSCRIPTION", "CONTENT"]),
  itemId: z.string().optional(),
  plan: z.enum(["FREE", "STUDENT_MONTHLY", "STUDENT_YEARLY", "TEACHER_MONTHLY", "TEACHER_YEARLY"]).optional(),
  provider: z.enum(["KONNECT", "FLOUCI", "MANUAL"]),
  /** When a parent pays for a linked student — publicId, email, or UUID */
  beneficiaryId: z.string().optional(),
})

export const approvePaymentSchema = z.object({
  paymentId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
})

export const manualActivationSchema = z.object({
  /** UUID, 8-digit public ID, or email */
  targetUserId: z.string().min(1, "ID, email ou n° compte requis"),
  plan: z.enum(["STUDENT_MONTHLY", "STUDENT_YEARLY", "TEACHER_MONTHLY", "TEACHER_YEARLY"]),
  durationDays: z.number().min(1).max(365),
  reason: z.string().optional(),
})

export const parentLinkSchema = z.object({
  /** Student email or 8-digit publicId */
  childIdentifier: z.string().min(1, "Email ou n° compte élève requis").optional(),
  /** @deprecated use childIdentifier — kept for backward compatibility */
  childEmail: z.string().email().optional(),
}).superRefine((data, ctx) => {
  if (!data.childIdentifier && !data.childEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email ou n° compte élève requis",
      path: ["childIdentifier"],
    })
  }
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
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateContentInput = z.infer<typeof createContentSchema>
export type ManualActivationInput = z.infer<typeof manualActivationSchema>
export type ParentLinkInput = z.infer<typeof parentLinkSchema>
export type ParentLinkRespondInput = z.infer<typeof parentLinkRespondSchema>
export type ProgressInput = z.infer<typeof progressSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
