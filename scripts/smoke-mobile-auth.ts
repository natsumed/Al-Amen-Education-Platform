/**
 * Smoke-test mobile auth crypto + login flow without the emulator.
 * Run: npx tsx scripts/smoke-mobile-auth.ts
 */
import { readFileSync } from "fs"
import { resolve } from "path"

// Load .env without depending on the dotenv package.
try {
  const envPath = resolve(__dirname, "../.env")
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
} catch {
  /* optional */
}

import { signMobileToken, verifyMobileToken } from "../src/lib/mobile-auth"

async function main() {
  const failures: string[] = []

  const signed = signMobileToken({
    sub: "user-1",
    email: "student@edutunisia.tn",
    role: "STUDENT",
    fullName: "Test",
  })
  const verified = verifyMobileToken(signed)
  if (!verified || verified.sub !== "user-1") failures.push("sign/verify roundtrip failed")

  const tampered = signed.slice(0, -4) + "xxxx"
  if (verifyMobileToken(tampered)) failures.push("tampered token should be rejected")

  const base = process.env.SMOKE_API_URL || "http://127.0.0.1:3000"
  const loginRes = await fetch(`${base}/api/mobile/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "  Student@EduTunisia.tn ", password: "student123" }),
  })
  const loginBody = (await loginRes.json()) as { token?: string; error?: string }
  if (!loginRes.ok || !loginBody.token) failures.push(`login HTTP ${loginRes.status}: ${loginBody.error}`)

  if (loginBody.token) {
    const meRes = await fetch(`${base}/api/mobile/auth/me`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    })
    if (!meRes.ok) failures.push(`me HTTP ${meRes.status}`)
  }

  if (failures.length) {
    console.error("SMOKE FAIL")
    failures.forEach((f) => console.error(" -", f))
    process.exit(1)
  }
  console.log("SMOKE OK — mobile auth crypto + login + me")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
