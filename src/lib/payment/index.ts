import { ClicToPayProvider } from "./clictopay"
import type { PaymentProviderInterface } from "./types"

export function getPaymentProvider(provider: string): PaymentProviderInterface {
  switch (provider) {
    case "CLICTOPAY":
      return new ClicToPayProvider()
    default:
      throw new Error(`Unknown payment provider: ${provider}`)
  }
}

export * from "./types"
export * from "./manual"
