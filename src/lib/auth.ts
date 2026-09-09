import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { verify as verifyArgon2, hash as hashArgon2 } from "@node-rs/argon2"
import { prisma } from "./prisma"
import type { Role } from "@/types"
import { loginLimiter } from "./rate-limit"
import { verifyMfaCode } from "./mfa"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
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
        totpCode: { label: "Security code", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        // Rate limiting check
        const email = String(credentials.email).trim().toLowerCase()
        const limit = await loginLimiter.check(email)
        if (!limit.allowed) {
          throw new Error("Too many login attempts. Please try again later.")
        }

        const user = await prisma.user.findUnique({ where: { email }, include: { mfaCredential: true } })

        if (!user || !user.passwordHash) return null
        if (user.isBanned) return null
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED")

        const password = credentials.password as string
        const isValid = user.passwordHash.startsWith("$argon2")
          ? await verifyArgon2(user.passwordHash, password)
          : await bcrypt.compare(password, user.passwordHash)

        if (!isValid) return null

        const mfaEnabled = Boolean(user.mfaCredential?.enabledAt)
        if (mfaEnabled) {
          const code = typeof credentials.totpCode === "string" ? credentials.totpCode : ""
          if (!code || !(await verifyMfaCode(user.id, code))) return null
        }

        // Reset rate limit on successful login
        await loginLimiter.reset(email)

        if (!user.passwordHash.startsWith("$argon2")) {
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await hashArgon2(password), passwordUpdatedAt: new Date() },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
          role: user.role as Role,
          fullName: user.fullName,
          sessionVersion: user.sessionVersion,
          mfaEnrollmentRequired: ["ADMIN", "TEACHER"].includes(user.role) && !mfaEnabled,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const verified = typeof profile === "object" && profile !== null &&
            "email_verified" in profile && profile.email_verified === true
          if (!verified || !user.email) return false
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { mfaCredential: true, externalAccounts: true },
          })

          if (!existingUser) {
            const { generatePublicId } = await import("./user-id")
            const publicId = await generatePublicId()
            const created = await prisma.user.create({
              data: {
                email: user.email!,
                fullName: user.name ?? "Google User",
                avatarUrl: user.image,
                emailVerified: new Date(),
                role: "STUDENT",
                publicId,
              },
            })
            await prisma.externalAccount.create({
              data: {
                provider: "google",
                providerAccountId: account.providerAccountId,
                userId: created.id,
                emailAtLink: user.email,
                lastLoginAt: new Date(),
              },
            })
            Object.assign(user, {
              id: created.id,
              role: created.role,
              fullName: created.fullName,
              sessionVersion: created.sessionVersion,
              mfaEnrollmentRequired: false,
            })
          } else {
            if (existingUser.isBanned) return false
            // Privileged accounts must use the credential flow so the platform's
            // own MFA policy cannot be bypassed by an OAuth login.
            if (["ADMIN", "TEACHER"].includes(existingUser.role)) return false
            await prisma.$transaction(async (tx) => {
              await tx.user.update({
                where: { id: existingUser.id },
                data: { avatarUrl: user.image ?? existingUser.avatarUrl, emailVerified: existingUser.emailVerified ?? new Date() },
              })
              await tx.externalAccount.upsert({
                where: { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } },
                update: { lastLoginAt: new Date(), emailAtLink: user.email, revokedAt: null },
                create: { provider: "google", providerAccountId: account.providerAccountId, userId: existingUser.id, emailAtLink: user.email, lastLoginAt: new Date() },
              })
            })
            Object.assign(user, {
              id: existingUser.id,
              role: existingUser.role,
              fullName: existingUser.fullName,
              sessionVersion: existingUser.sessionVersion,
              mfaEnrollmentRequired: false,
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
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0
        token.mfaEnrollmentRequired = (user as { mfaEnrollmentRequired?: boolean }).mfaEnrollmentRequired ?? false
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
            select: { role: true, fullName: true, isBanned: true, avatarUrl: true, sessionVersion: true },
          })
          if (!dbUser || dbUser.isBanned || dbUser.sessionVersion !== token.sessionVersion) {
            token.error = "banned"
          } else {
            token.role = dbUser.role as Role
            token.fullName = dbUser.fullName
            token.picture = dbUser.avatarUrl
            delete token.error
            if (dbUser.sessionVersion === token.sessionVersion) {
              const mfa = await prisma.mfaCredential.findUnique({ where: { userId: token.id as string }, select: { enabledAt: true } })
              token.mfaEnrollmentRequired = ["ADMIN", "TEACHER"].includes(dbUser.role) && !mfa?.enabledAt
            }
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
        session.user.mfaEnrollmentRequired = token.mfaEnrollmentRequired
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
