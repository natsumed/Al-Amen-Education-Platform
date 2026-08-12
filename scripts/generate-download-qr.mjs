#!/usr/bin/env node
/**
 * Generate QR PNG pointing to the Amenallah Android download page (not the raw APK).
 * Usage:
 *   NEXT_PUBLIC_APP_URL=https://example.tn node scripts/generate-download-qr.mjs
 *   node scripts/generate-download-qr.mjs --url https://example.tn/download
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import QRCode from "qrcode"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const urlIdx = args.indexOf("--url")
const outIdx = args.indexOf("--out")
const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
const url = urlIdx >= 0 && args[urlIdx + 1] ? args[urlIdx + 1] : `${base}/download`
const out =
  outIdx >= 0 && args[outIdx + 1]
    ? args[outIdx + 1]
    : path.join(__dirname, "..", "public", "images", "android-download-qr.png")

fs.mkdirSync(path.dirname(out), { recursive: true })
await QRCode.toFile(out, url, {
  margin: 2,
  width: 360,
  color: { dark: "#0f172a", light: "#ffffff" },
})
console.log(`Wrote ${out}`)
console.log(`Encodes: ${url}`)
