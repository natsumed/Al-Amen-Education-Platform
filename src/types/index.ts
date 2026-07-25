export type Role = "ADMIN" | "STUDENT" | "TEACHER" | "PARENT"
export type Grade = "GRADE_1" | "GRADE_2" | "GRADE_3" | "GRADE_4" | "GRADE_5" | "GRADE_6"
export type Subject = "ARABIC" | "FRENCH" | "MATH" | "SCIENCE" | "ISLAMIC" | "HISTORY" | "CIVIC" | "ARTS" | "ENGLISH"
export type ContentType = "COURSE" | "BOOK" | "SERIES" | "ANIMATION"
export type SubscriptionPlan = "FREE" | "STUDENT_MONTHLY" | "STUDENT_YEARLY" | "TEACHER_MONTHLY" | "TEACHER_YEARLY"
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED"
export type PaymentProvider = "KONNECT" | "FLOUCI" | "MANUAL"
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"
export type ParentLinkStatus = "PENDING" | "ACCEPTED" | "REJECTED"
export type Language = "ar" | "fr"

export interface User {
  id: string
  publicId: string
  email: string
  phone?: string | null
  fullName: string
  role: Role
  avatarUrl?: string | null
  googleId?: string | null
  emailVerified?: Date | null
  isBanned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: Date
  endDate: Date
  autoRenew: boolean
  createdAt: Date
}

export interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  provider: PaymentProvider
  status: PaymentStatus
  transactionRef?: string | null
  itemType: string
  itemId?: string | null
  createdAt: Date
}

export interface Content {
  id: string
  titleAr: string
  titleFr: string
  descriptionAr?: string | null
  descriptionFr?: string | null
  grade: Grade
  subject: Subject
  contentType: ContentType
  isFree: boolean
  price?: number | null
  thumbnailUrl?: string | null
  youtubeUrl?: string | null
  pdfUrl?: string | null
  gifUrl?: string | null
  fileUrls: string[]
  status: string
  uploadedById: string
  createdAt: Date
  updatedAt: Date
  uploadedBy?: User
  reviews?: Review[]
  progress?: Progress[]
}

export interface Review {
  id: string
  userId: string
  contentId: string
  rating: number
  comment?: string | null
  createdAt: Date
  user?: User
}

export interface Progress {
  id: string
  userId: string
  contentId: string
  completed: boolean
  progressPercent: number
  lastAccessed: Date
  content?: Content
}

export interface ParentLink {
  id: string
  parentId: string
  studentId: string
  status: ParentLinkStatus
  createdAt: Date
  parent?: User
  student?: User
}

export interface Purchase {
  id: string
  userId: string
  contentId: string
  createdAt: Date
  content?: Content
}

export interface ManualActivationLog {
  id: string
  adminId: string
  targetUserId: string
  plan: SubscriptionPlan
  durationDays: number
  reason?: string | null
  createdAt: Date
  admin?: User
  targetUser?: User
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
  limit: number
}

export interface ContentFilters {
  grade?: Grade
  subject?: Subject
  contentType?: ContentType
  isFree?: boolean
  search?: string
  page?: number
  limit?: number
}

export interface AdminStats {
  totalUsers: number
  totalContent: number
  totalRevenue: number
  activeSubscriptions: number
  newUsersThisMonth: number
  contentByType: Record<ContentType, number>
}

export interface PricingPlan {
  id: SubscriptionPlan
  nameKey: string
  price: number
  period: "monthly" | "yearly"
  role: "STUDENT" | "TEACHER"
  features: string[]
  popular?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "STUDENT_MONTHLY",
    nameKey: "subscription.studentPlan",
    price: 15,
    period: "monthly",
    role: "STUDENT",
    features: ["allVideos", "allPDFs", "downloadAll", "progressTracking", "parentMonitoring"],
  },
  {
    id: "STUDENT_YEARLY",
    nameKey: "subscription.studentPlan",
    price: 120,
    period: "yearly",
    role: "STUDENT",
    popular: true,
    features: ["allVideos", "allPDFs", "downloadAll", "progressTracking", "parentMonitoring", "twoMonthsFree"],
  },
  {
    id: "TEACHER_MONTHLY",
    nameKey: "subscription.teacherPlan",
    price: 25,
    period: "monthly",
    role: "TEACHER",
    features: ["allVideos", "allPDFs", "downloadAll", "animations", "classroomTools"],
  },
  {
    id: "TEACHER_YEARLY",
    nameKey: "subscription.teacherPlan",
    price: 200,
    period: "yearly",
    role: "TEACHER",
    popular: true,
    features: ["allVideos", "allPDFs", "downloadAll", "animations", "classroomTools", "twoMonthsFree"],
  },
]

export const GRADE_LABELS: Record<Grade, string> = {
  GRADE_1: "1",
  GRADE_2: "2",
  GRADE_3: "3",
  GRADE_4: "4",
  GRADE_5: "5",
  GRADE_6: "6",
}

export const SUBJECT_LABELS: Record<Subject, { ar: string; fr: string }> = {
  ARABIC: { ar: "اللغة العربية", fr: "Arabe" },
  FRENCH: { ar: "الفرنسية", fr: "Français" },
  MATH: { ar: "الرياضيات", fr: "Mathématiques" },
  SCIENCE: { ar: "العلوم", fr: "Sciences" },
  ISLAMIC: { ar: "التربية الإسلامية", fr: "Éducation islamique" },
  HISTORY: { ar: "التاريخ والجغرافيا", fr: "Histoire-Géographie" },
  CIVIC: { ar: "التربية المدنية", fr: "Éducation civique" },
  ARTS: { ar: "الفنون", fr: "Arts" },
  ENGLISH: { ar: "الإنجليزية", fr: "Anglais" },
}
