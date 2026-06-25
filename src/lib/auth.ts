import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { Role } from "@/types"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.passwordHash) return null
        if (user.isBanned) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
          role: user.role as Role,
          fullName: user.fullName,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                fullName: user.name ?? "Google User",
                googleId: account.providerAccountId,
                avatarUrl: user.image,
                emailVerified: new Date(),
                role: "STUDENT",
              },
            })
          } else {
            if (existingUser.isBanned) return false
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: account.providerAccountId,
                avatarUrl: user.image ?? existingUser.avatarUrl,
              },
            })
          }
        } catch (error) {
          console.error("signIn callback error:", error)
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      // On first login, store user data in token
      if (user) {
        token.id = user.id!
        token.role = (user as any).role ?? "STUDENT"
        token.fullName = (user as any).fullName ?? user.name ?? ""
      }
      // On subsequent requests, just return the existing token
      // No database queries here - middleware runs in Edge Runtime which doesn't support Prisma
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.fullName = token.fullName as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
