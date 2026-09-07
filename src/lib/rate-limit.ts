import { getRedisClient } from "./redis"

type RateLimitEntry = { count: number; resetAt: number }
const memoryFallback = new Map<string, RateLimitEntry>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const CHECK_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { count, ttl }
`

function checkMemory(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const current = memoryFallback.get(key)
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowMs }
    : { count: current.count + 1, resetAt: current.resetAt }
  memoryFallback.set(key, entry)

  return {
    allowed: entry.count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - entry.count),
    resetAt: entry.resetAt,
  }
}

export function rateLimit(prefix: string, maxAttempts: number, windowMs: number) {
  return {
    check: async (identifier: string): Promise<RateLimitResult> => {
      const key = `amenallah:rate:${prefix}:${identifier}`
      const redis = await getRedisClient()
      if (!redis) return checkMemory(key, maxAttempts, windowMs)

      try {
        const result = await redis.eval(CHECK_SCRIPT, {
          keys: [key],
          arguments: [String(windowMs)],
        }) as [number, number]
        const [count, ttl] = result.map(Number)
        return {
          allowed: count <= maxAttempts,
          remaining: Math.max(0, maxAttempts - count),
          resetAt: Date.now() + Math.max(0, ttl),
        }
      } catch {
        return checkMemory(key, maxAttempts, windowMs)
      }
    },
    reset: async (identifier: string): Promise<void> => {
      const key = `amenallah:rate:${prefix}:${identifier}`
      memoryFallback.delete(key)
      const redis = await getRedisClient()
      if (redis) await redis.del(key).catch(() => undefined)
    },
  }
}

export const loginLimiter = rateLimit("login", 5, 5 * 60 * 1000)
export const registerLimiter = rateLimit("register", 3, 60 * 60 * 1000)
export const forgotPasswordLimiter = rateLimit("forgot-pw", 3, 60 * 60 * 1000)
export const playbackLimiter = rateLimit("playback", 30, 5 * 60 * 1000)
export const ingestionLimiter = rateLimit("ingestion", 20, 60 * 60 * 1000)
export const paymentLimiter = rateLimit("payment", 10, 15 * 60 * 1000)
