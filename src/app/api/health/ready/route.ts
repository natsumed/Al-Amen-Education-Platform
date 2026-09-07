import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRedisClient } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, "ok" | "error" | "disabled"> = {
    database: "error",
    valkey: process.env.REDIS_URL ? "error" : "disabled",
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = "ok"
  } catch {
    // Deliberately do not expose infrastructure errors to the public response.
  }

  if (process.env.REDIS_URL) {
    try {
      const redis = await getRedisClient()
      if (redis && (await redis.ping()) === "PONG") checks.valkey = "ok"
    } catch {
      // Keep the generic status only.
    }
  }

  const ready = checks.database === "ok" && checks.valkey !== "error"
  return NextResponse.json(
    { status: ready ? "ready" : "not_ready", checks, timestamp: new Date().toISOString() },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  )
}
