// File-based rate limiter — persists across Next.js dev mode hot reloads
import fs from "fs"
import path from "path"

const STORE_PATH = path.join(process.cwd(), ".opencode", "rate-limits.json")

function readStore(): Record<string, { count: number; resetAt: number }> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {}
    const raw = fs.readFileSync(STORE_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, { count: number; resetAt: number }>) {
  try {
    const dir = path.dirname(STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
  } catch {
    // silently fail if can't write
  }
}

function cleanup(store: Record<string, { count: number; resetAt: number }>) {
  const now = Date.now()
  let changed = false
  for (const key of Object.keys(store)) {
    if (now > store[key].resetAt) {
      delete store[key]
      changed = true
    }
  }
  return changed
}

export function rateLimit(prefix: string, maxAttempts: number, windowMs: number) {
  return {
    check: (identifier: string): { allowed: boolean; remaining: number; resetAt: number } => {
      const store = readStore()
      const changed = cleanup(store)
      if (changed) writeStore(store)

      const key = `${prefix}:${identifier}`
      const now = Date.now()
      const existing = store[key]

      if (!existing || now > existing.resetAt) {
        store[key] = { count: 1, resetAt: now + windowMs }
        writeStore(store)
        return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs }
      }

      existing.count++
      writeStore(store)

      if (existing.count > maxAttempts) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt }
      }

      return { allowed: true, remaining: maxAttempts - existing.count, resetAt: existing.resetAt }
    },
    reset: (identifier: string) => {
      const store = readStore()
      delete store[`${prefix}:${identifier}`]
      writeStore(store)
    },
  }
}

export const loginLimiter = rateLimit("login", 5, 5 * 60 * 1000)
export const registerLimiter = rateLimit("register", 3, 60 * 60 * 1000)
export const forgotPasswordLimiter = rateLimit("forgot-pw", 3, 60 * 60 * 1000)
