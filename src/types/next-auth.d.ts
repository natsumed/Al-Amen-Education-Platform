import { DefaultSession } from "next-auth"
import { Role } from "./index"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      fullName: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    fullName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    fullName: string
  }
}
