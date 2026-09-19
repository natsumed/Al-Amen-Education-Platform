import { createHmac, timingSafeEqual } from "node:crypto"
import type {
  GatewayNotification,
  GatewayOrder,
  GatewayPaymentStatus,
  GatewayRegistration,
  PaymentProviderInterface,
} from "./types"

export type ClicToPayMode = "disabled" | "sandbox" | "production"

export function getClicToPayMode(): ClicToPayMode {
  const value = process.env.CLICTOPAY_MODE?.toLowerCase()
  if (value === "sandbox" || value === "production") return value
  return "disabled"
}

export function isMockClicToPayEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.CLICTOPAY_MOCK === "true"
}

export function getClicToPayReadiness() {
  const mode = getClicToPayMode()
  const credentialsPresent = mode !== "disabled" && Boolean(
    process.env.CLICTOPAY_MERCHANT_ID &&
    process.env.CLICTOPAY_API_URL &&
    process.env.CLICTOPAY_API_SECRET
  )
  // The official SMT field mapping, notification authentication, status
  // mapping and certification suite must all be completed before this flag is
  // set. Credentials alone are deliberately insufficient to advertise the
  // method to customers.
  const adapterCertified = process.env.CLICTOPAY_ADAPTER_CERTIFIED === "true"
  const configured = credentialsPresent && adapterCertified
  const mockEnabled = isMockClicToPayEnabled()
  return {
    mode,
    configured,
    credentialsPresent,
    adapterCertified,
    available: mockEnabled || configured,
    reason: configured || mockEnabled
      ? null
      : mode === "disabled"
        ? "DISABLED"
        : !credentialsPresent
          ? "CREDENTIALS_MISSING"
          : "ADAPTER_NOT_CERTIFIED",
  }
}

export function assertClicToPayProductionConfiguration() {
  const readiness = getClicToPayReadiness()
  if (readiness.mode === "production" && !readiness.configured) {
    throw new Error("CLICTOPAY_PRODUCTION_CONFIGURATION_INVALID")
  }
  if (process.env.NODE_ENV === "production" && process.env.CLICTOPAY_MOCK === "true") {
    throw new Error("CLICTOPAY_MOCK_FORBIDDEN_IN_PRODUCTION")
  }
}

/**
 * SMT supplies the authoritative fields, authentication scheme, notification
 * signature and status endpoint during merchant onboarding. This adapter
 * deliberately fails closed until that official kit is mapped and certified.
 */
export class SmtClicToPayProvider implements PaymentProviderInterface {
  async registerPayment(_order: GatewayOrder): Promise<GatewayRegistration> {
    assertClicToPayProductionConfiguration()
    if (!getClicToPayReadiness().configured) throw new Error("CLICTOPAY_NOT_CONFIGURED")
    throw new Error("CLICTOPAY_OFFICIAL_KIT_REQUIRED")
  }

  async verifyNotification(_rawBody: Buffer, _headers: Headers): Promise<GatewayNotification> {
    assertClicToPayProductionConfiguration()
    throw new Error("CLICTOPAY_OFFICIAL_KIT_REQUIRED")
  }

  async queryPayment(_payment: { merchantOrderRef: string; providerOrderRef?: string | null; amountMillis: number; currency: string }): Promise<GatewayPaymentStatus> {
    assertClicToPayProductionConfiguration()
    throw new Error("CLICTOPAY_OFFICIAL_KIT_REQUIRED")
  }
}

/** Local/test-only simulator; the production guard prevents accidental use. */
export class MockClicToPayProvider implements PaymentProviderInterface {
  private secret() {
    return process.env.CLICTOPAY_MOCK_SECRET || "amenallah-local-payment-mock"
  }

  async registerPayment(order: GatewayOrder): Promise<GatewayRegistration> {
    if (!isMockClicToPayEnabled()) throw new Error("CLICTOPAY_MOCK_DISABLED")
    const origin = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
    return {
      providerOrderRef: `MOCK-${order.merchantOrderRef}`,
      redirectUrl: `${origin}/checkout/clictopay/mock?paymentId=${encodeURIComponent(order.paymentId)}`,
      expiresAt: new Date(Date.now() + 30 * 60_000),
    }
  }

  async verifyNotification(rawBody: Buffer, headers: Headers): Promise<GatewayNotification> {
    if (!isMockClicToPayEnabled()) throw new Error("CLICTOPAY_MOCK_DISABLED")
    const supplied = headers.get("x-amenallah-mock-signature") || ""
    const expected = createHmac("sha256", this.secret()).update(rawBody).digest("hex")
    const valid = supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    const body = JSON.parse(rawBody.toString("utf8")) as GatewayNotification
    return { ...body, verified: valid }
  }

  async queryPayment(payment: { merchantOrderRef: string; providerOrderRef?: string | null; amountMillis: number; currency: string }): Promise<GatewayPaymentStatus> {
    if (!isMockClicToPayEnabled()) throw new Error("CLICTOPAY_MOCK_DISABLED")
    const requested = process.env.CLICTOPAY_MOCK_QUERY_STATUS
    const status = requested && ["SUCCEEDED", "DECLINED", "CANCELLED", "EXPIRED", "REFUNDED"].includes(requested)
      ? requested as GatewayPaymentStatus["status"]
      : "SUCCEEDED"
    return {
      merchantOrderRef: payment.merchantOrderRef,
      providerOrderRef: payment.providerOrderRef || undefined,
      providerTransactionRef: `MOCK-TX-${payment.merchantOrderRef}`,
      status,
      amountMillis: payment.amountMillis,
      currency: payment.currency,
      verified: true,
    }
  }
}

export const ClicToPayProvider = SmtClicToPayProvider
export function isClicToPayConfigured() {
  return getClicToPayReadiness().configured
}
