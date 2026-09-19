import {
  isMockClicToPayEnabled,
  MockClicToPayProvider,
  SmtClicToPayProvider,
} from "./clictopay"
import type { PaymentProviderInterface } from "./types"

export function getPaymentProvider(provider: string): PaymentProviderInterface {
  if (provider !== "CLICTOPAY") throw new Error("PAYMENT_PROVIDER_INVALID")
  return isMockClicToPayEnabled()
    ? new MockClicToPayProvider()
    : new SmtClicToPayProvider()
}

export * from "./types"
export * from "./catalog"
export * from "./manual"
export * from "./service"
