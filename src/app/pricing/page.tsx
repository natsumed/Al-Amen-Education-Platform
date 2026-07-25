"use client"

import { MarketingNavbar } from "@/components/layout/marketing-navbar"
import Pricing from "@/components/shadcn-space/blocks/pricing-01/pricing"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <MarketingNavbar solid />
      <Pricing />
    </div>
  )
}
