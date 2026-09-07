import { createClient, type RedisClientType } from "redis"

type RedisGlobal = typeof globalThis & {
  amenallahRedisPromise?: Promise<RedisClientType | null>
}

const redisGlobal = globalThis as RedisGlobal

async function connectRedis(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL
  if (!url) return null

  const client = createClient({ url })
  client.on("error", (error) => {
    console.error("Redis connection error", error instanceof Error ? error.message : "unknown")
  })

  try {
    await client.connect()
    return client as RedisClientType
  } catch (error) {
    console.error("Redis unavailable; using process-local safety fallback", error)
    return null
  }
}

export function getRedisClient(): Promise<RedisClientType | null> {
  if (!redisGlobal.amenallahRedisPromise) {
    redisGlobal.amenallahRedisPromise = connectRedis()
  }
  return redisGlobal.amenallahRedisPromise
}
