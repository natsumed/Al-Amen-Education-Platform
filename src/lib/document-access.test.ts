import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { signDocumentGrant, verifyDocumentGrant } from "./document-access"

describe("document page grants", () => {
  beforeEach(() => { process.env.AUTH_SECRET = "test-document-secret-that-is-long-enough" })
  afterEach(() => delete process.env.AUTH_SECRET)

  it("allows only the signed adjacent pages", async () => {
    const token = await signDocumentGrant({ userId: "u1", contentId: "c1", assetId: "a1", pages: [2, 3, 4] })
    await expect(verifyDocumentGrant(token)).resolves.toMatchObject({ pages: [2, 3, 4] })
    await expect(verifyDocumentGrant(`${token}x`)).resolves.toBeNull()
  })
})
