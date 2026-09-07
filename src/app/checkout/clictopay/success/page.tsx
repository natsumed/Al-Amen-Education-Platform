import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ClicToPaySuccessPage() {
  return <main className="container max-w-xl py-20 text-center space-y-5">
    <h1 className="text-2xl font-bold">Paiement reçu pour vérification</h1>
    <p className="text-muted-foreground">Votre abonnement sera activé uniquement après confirmation sécurisée par SMT.</p>
    <Link href="/profile"><Button>Voir mon compte</Button></Link>
  </main>
}
