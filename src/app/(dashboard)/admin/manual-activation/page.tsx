import { redirect } from "next/navigation"

export default function ManualActivationRedirect() {
  redirect("/admin/payments/manual")
}
