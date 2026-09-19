import { notFound } from "next/navigation"
import { MockClicToPayClient } from "./mock-client"

export default function MockClicToPayPage() {
  if (process.env.NODE_ENV === "production" || process.env.CLICTOPAY_MOCK !== "true") notFound()
  return <MockClicToPayClient />
}
