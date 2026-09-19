import Link from "next/link"

export default function RefundPolicyPage() {
  return <main className="container max-w-3xl py-12 prose prose-slate dark:prose-invert">
    <h1>Politique de remboursement / سياسة الاسترجاع</h1>
    <p>Envoyez toute demande avec la référence du paiement à <a href="mailto:support@amanallahedition.com">support@amanallahedition.com</a>. Chaque demande est examinée selon la réglementation applicable, le contrat marchand et l’utilisation déjà effectuée du service.</p>
    <p dir="rtl">ترسل طلبات الاسترجاع مع مرجع الدفع إلى بريد الدعم. تتم دراسة كل طلب حسب القانون والعقد التجاري واستعمال الخدمة.</p>
    <p>Un paiement par carte est remboursé uniquement par la procédure banque/SMT/SPS et jamais en espèces ou par un autre canal. L’accès correspondant est retiré seulement après confirmation du remboursement; les autres achats valides restent actifs.</p>
    <p>Un remboursement en attente n’est pas encore final. Le reçu et l’historique affichent le statut vérifié.</p>
    <p><Link href="/terms">Retour aux conditions de vente</Link></p>
  </main>
}
