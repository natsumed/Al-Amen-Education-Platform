import { KonnectProvider } from "./konnect"
import { FlouciProvider } from "./flouci"
import type { PaymentProviderInterface } from "./types"

export function getPaymentProvider(provider: string): PaymentProviderInterface {
  switch (provider) {
    case "KONNECT":
      return new KonnectProvider()
    case "FLOUCI":
      return new FlouciProvider()
    default:
      throw new Error(`Unknown payment provider: ${provider}`)
  }
}

export * from "./types"
export * from "./manual"
