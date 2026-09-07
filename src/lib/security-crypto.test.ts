import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { decryptSecret, encryptSecret, hashOpaqueToken } from "./security-crypto"

describe("security crypto", () => {
  beforeEach(() => {
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")
  })
  afterEach(() => delete process.env.DATA_ENCRYPTION_KEY)

  it("encrypts authenticated data without preserving plaintext", () => {
    const encrypted = encryptSecret("https://drive.google.com/private")
    expect(encrypted).not.toContain("drive.google.com")
    expect(decryptSecret(encrypted)).toBe("https://drive.google.com/private")
  })

  it("hashes reset and refresh tokens deterministically", () => {
    expect(hashOpaqueToken("secret")).toHaveLength(64)
    expect(hashOpaqueToken("secret")).toBe(hashOpaqueToken("secret"))
    expect(hashOpaqueToken("secret")).not.toBe(hashOpaqueToken("other"))
  })
})
