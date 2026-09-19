import Link from "next/link"

export default function TermsPage() {
  return <main className="container max-w-3xl py-12 prose prose-slate dark:prose-invert">
    <h1>Conditions de vente / شروط البيع</h1>
    <p>Les services Amenallah Edition donnent accès à des abonnements éducatifs de 30 ou 365 jours et à des contenus numériques achetés individuellement. Le produit, le bénéficiaire, le prix total en TND et la durée sont récapitulés avant confirmation.</p>
    <p dir="rtl">تتيح منصة أمان الله اشتراكات تعليمية لمدة 30 أو 365 يوماً ومحتويات رقمية تباع بشكل منفرد. يظهر المنتج والمستفيد والسعر الكامل بالدينار والمدة قبل التأكيد.</p>
    <h2>Paiement</h2>
    <p>Les espèces sont confirmées par l’administration après réception. Pour ClicToPay, les données de carte sont saisies exclusivement sur le serveur sécurisé SMT/SPS. Amenallah Edition ne reçoit ni ne conserve le numéro de carte, le cryptogramme ou la date d’expiration.</p>
    <h2>Livraison numérique</h2>
    <p>L’accès est accordé uniquement après confirmation du paiement. Un retour navigateur, une capture d’écran ou un justificatif non vérifié ne constitue pas une confirmation.</p>
    <h2>Contact</h2>
    <p><a href="mailto:support@amanallahedition.com">support@amanallahedition.com</a></p>
    <p><Link href="/refund-policy">Politique de remboursement</Link> · <Link href="/privacy">Confidentialité</Link></p>
  </main>
}
