import type { PaymentStatus } from "@prisma/client"

export type GatewayOrder = {
  paymentId: string
  merchantOrderRef: string
  amountMillis: number
  currency: "TND"
  description: string
  successUrl: string
  failureUrl: string
  notificationUrl: string
}

export type GatewayRegistration = {
  providerOrderRef: string
  redirectUrl: string
  expiresAt: Date
}

export type GatewayNotification = {
  merchantOrderRef: string
  providerEventRef?: string
  providerOrderRef?: string
  providerTransactionRef?: string
  status: PaymentStatus
  amountMillis?: number
  currency?: string
  verified: boolean
  metadata?: Record<string, string | number | boolean | null>
}

export type GatewayPaymentStatus = Omit<GatewayNotification, "verified"> & { verified: true }

export interface PaymentProviderInterface {
  registerPayment(order: GatewayOrder): Promise<GatewayRegistration>
  verifyNotification(rawBody: Buffer, headers: Headers): Promise<GatewayNotification>
  queryPayment(payment: {
    merchantOrderRef: string
    providerOrderRef?: string | null
    amountMillis: number
    currency: string
  }): Promise<GatewayPaymentStatus>
  requestRefund?(payment: {
    merchantOrderRef: string
    providerTransactionRef?: string | null
    amountMillis: number
  }): Promise<{ providerEventRef?: string; status: PaymentStatus }>
}
