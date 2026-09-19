import { createHmac } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { assertClicToPayProductionConfiguration, getClicToPayReadiness, MockClicToPayProvider } from "./clictopay"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("ClicToPay readiness", () => {
  it("is disabled by default", () => {
    vi.stubEnv("CLICTOPAY_MODE", "")
    vi.stubEnv("CLICTOPAY_MOCK", "false")
    expect(getClicToPayReadiness()).toMatchObject({ available: false, reason: "DISABLED" })
  })

  it("does not expose the gateway merely because credentials exist", () => {
    vi.stubEnv("CLICTOPAY_MODE", "sandbox")
    vi.stubEnv("CLICTOPAY_MERCHANT_ID", "merchant")
    vi.stubEnv("CLICTOPAY_API_URL", "https://sandbox.example.invalid")
    vi.stubEnv("CLICTOPAY_API_SECRET", "secret")
    vi.stubEnv("CLICTOPAY_ADAPTER_CERTIFIED", "false")
    expect(getClicToPayReadiness()).toMatchObject({
      available: false,
      credentialsPresent: true,
      adapterCertified: false,
      reason: "ADAPTER_NOT_CERTIFIED",
    })
  })

  it("rejects production mock configuration", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("CLICTOPAY_MOCK", "true")
    expect(() => assertClicToPayProductionConfiguration()).toThrow("CLICTOPAY_MOCK_FORBIDDEN_IN_PRODUCTION")
  })

  it("simulates registration, signed notification, and authoritative query only outside production", async () => {
    vi.stubEnv("NODE_ENV", "test")
    vi.stubEnv("CLICTOPAY_MOCK", "true")
    vi.stubEnv("CLICTOPAY_MOCK_SECRET", "test-secret")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    const provider = new MockClicToPayProvider()
    const order = {
      paymentId: "payment-1",
      merchantOrderRef: "AMEN-ORDER-1",
      amountMillis: 15_000,
      currency: "TND" as const,
      description: "Monthly plan",
      successUrl: "http://localhost:3000/success",
      failureUrl: "http://localhost:3000/failure",
      notificationUrl: "http://localhost:3000/notify",
    }
    const registration = await provider.registerPayment(order)
    expect(registration.redirectUrl).toContain("/checkout/clictopay/mock")

    const rawBody = Buffer.from(JSON.stringify({
      merchantOrderRef: order.merchantOrderRef,
      status: "SUCCEEDED",
      amountMillis: order.amountMillis,
      currency: order.currency,
    }))
    const signature = createHmac("sha256", "test-secret").update(rawBody).digest("hex")
    const notification = await provider.verifyNotification(rawBody, new Headers({
      "x-amenallah-mock-signature": signature,
    }))
    expect(notification.verified).toBe(true)

    const queried = await provider.queryPayment({
      merchantOrderRef: order.merchantOrderRef,
      providerOrderRef: registration.providerOrderRef,
      amountMillis: order.amountMillis,
      currency: order.currency,
    })
    expect(queried).toMatchObject({ status: "SUCCEEDED", amountMillis: 15_000, currency: "TND" })
  })
})
