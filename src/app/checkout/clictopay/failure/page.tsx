import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ClicToPayFailurePage() {
  return <main className="container max-w-xl py-20 text-center space-y-5">
    <h1 className="text-2xl font-bold">Paiement non finalisé</h1>
    <p className="text-muted-foreground">Aucun abonnement n&apos;a été activé. Vous pouvez réessayer ou choisir le paiement manuel.</p>
    <Link href="/checkout"><Button>Retour au paiement</Button></Link>
  </main>
}
