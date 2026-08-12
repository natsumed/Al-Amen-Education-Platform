import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import type { Role } from "@/types"
import { loginLimiter } from "./rate-limit"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        // Rate limiting check
        const email = String(credentials.email).trim().toLowerCase()
        const limit = loginLimiter.check(email)
        if (!limit.allowed) {
          throw new Error("Too many login attempts. Please try again later.")
        }

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) return null
        if (user.isBanned) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        // Reset rate limit on successful login
        loginLimiter.reset(email)

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
            const { generatePublicId } = await import("./user-id")
            const publicId = await generatePublicId()
            await prisma.user.create({
              data: {
                email: user.email!,
                fullName: user.name ?? "Google User",
                googleId: account.providerAccountId,
                avatarUrl: user.image,
                emailVerified: new Date(),
                role: "STUDENT",
                publicId,
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

    async jwt({ token, user, trigger, session }) {
      // On first login, store user data in token
      if (user) {
        token.id = user.id!
        token.role = (user as { role?: Role }).role ?? "STUDENT"
        token.fullName = (user as { fullName?: string }).fullName ?? user.name ?? ""
        token.picture = user.image ?? null
        token.lastChecked = Date.now()
      }

      // Client called session.update({ image }) after avatar upload
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { image?: string | null; name?: string; fullName?: string }
        if (patch.image !== undefined) token.picture = patch.image
        if (patch.fullName) token.fullName = patch.fullName
        if (patch.name) token.fullName = patch.name
      }

      // Refresh role / ban / avatar periodically (Node runtime — not Edge middleware)
      const lastChecked = typeof token.lastChecked === "number" ? token.lastChecked : 0
      if (token.id && Date.now() - lastChecked > 5 * 60 * 1000) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, fullName: true, isBanned: true, avatarUrl: true },
          })
          if (!dbUser || dbUser.isBanned) {
            token.error = "banned"
          } else {
            token.role = dbUser.role as Role
            token.fullName = dbUser.fullName
            token.picture = dbUser.avatarUrl
            delete token.error
          }
          token.lastChecked = Date.now()
        } catch {
          // Keep existing claims if DB briefly unavailable
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token?.error === "banned") {
        // Force clients to treat session as invalid
        return { ...session, user: { ...session.user, id: "", role: "STUDENT" as Role, fullName: "" } }
      }
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.fullName = token.fullName as string
        session.user.name = (token.fullName as string) || session.user.name
        session.user.image = (token.picture as string | null | undefined) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
