import type { PaymentProviderInterface, PaymentSession } from "./types"

export function isClicToPayConfigured() {
  return process.env.CLICTOPAY_ENABLED === "true" && Boolean(
    process.env.CLICTOPAY_MERCHANT_ID &&
    process.env.CLICTOPAY_API_URL &&
    process.env.CLICTOPAY_API_SECRET
  )
}

/**
 * SMT supplies the authoritative request fields, signing rules and status API
 * only after merchant onboarding. This adapter deliberately fails closed until
 * that official kit is installed and certified; it never guesses bank fields.
 */
export class ClicToPayProvider implements PaymentProviderInterface {
  async createPayment(): Promise<PaymentSession> {
    if (!isClicToPayConfigured()) throw new Error("CLICTOPAY_NOT_CONFIGURED")
    throw new Error("CLICTOPAY_OFFICIAL_KIT_REQUIRED")
  }

  verifyWebhook(): boolean {
    return false
  }
}
