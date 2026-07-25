export interface PaymentSession {
  paymentId: string
  redirectUrl?: string
  status: "PENDING" | "SUCCESS" | "FAILED"
  message?: string
}

export interface PaymentProviderInterface {
  createPayment(params: {
    amount: number
    currency: string
    description: string
    returnUrl: string
    paymentId: string
  }): Promise<PaymentSession>
  verifyWebhook(payload: unknown, signature: string): boolean
}
