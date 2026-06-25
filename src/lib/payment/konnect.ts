import type { PaymentProviderInterface, PaymentSession } from "./types"

export class KonnectProvider implements PaymentProviderInterface {
  async createPayment(params: {
    amount: number; currency: string; description: string; returnUrl: string; paymentId: string
  }): Promise<PaymentSession> {
    // Phase 2: Real Konnect integration
    return {
      paymentId: params.paymentId,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending`,
      status: "PENDING",
      message: "Konnect integration — Phase 2",
    }
  }
  verifyWebhook(_payload: unknown, _signature: string): boolean { return false }
}
