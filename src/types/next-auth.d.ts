import { DefaultSession } from "next-auth"
import { Role } from "./index"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      fullName: string
      mfaEnrollmentRequired?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    fullName: string
    sessionVersion?: number
    mfaEnrollmentRequired?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    fullName: string
    lastChecked?: number
    error?: string
    sessionVersion?: number
    mfaEnrollmentRequired?: boolean
  }
}
