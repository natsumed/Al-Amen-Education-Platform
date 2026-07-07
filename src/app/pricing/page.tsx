"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowLeft } from "lucide-react"
import { PRICING_PLANS } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { useLanguage } from "@/providers/language-provider"

export default function PricingPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"

  const FEATURES_FR: Record<string, string> = {
    allVideos: "Tous les cours vidéo", allPDFs: "Tous les livres PDF",
    downloadAll: "Téléchargement illimité", progressTracking: "Suivi de progression",
    parentMonitoring: "Suivi parental", animations: "Animations éducatives",
    classroomTools: "Outils de classe", twoMonthsFree: "2 mois offerts",
  }
  const FEATURES_AR: Record<string, string> = {
    allVideos: "جميع دروس الفيديو", allPDFs: "جميع كتب PDF",
    downloadAll: "تحميل غير محدود", progressTracking: "متابعة التقدم",
    parentMonitoring: "متابعة الوالدين", animations: "رسوم متحركة",
    classroomTools: "أدوات الفصل", twoMonthsFree: "شهران مجاناً",
  }

  const features = isAr ? FEATURES_AR : FEATURES_FR

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <nav className="border-b bg-white/80 sticky top-0 z-50">
        <div className="container flex h-16 items-center gap-3">
          <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <span className="font-bold text-xl">{isAr ? "أمان الله" : "Amenallah"}</span>
        </div>
      </nav>
      <main className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{isAr ? "اختر خطتك" : "Choisissez votre abonnement"}</h1>
          <p className="text-muted-foreground text-lg">{isAr ? "وصول كامل لجميع المحتويات التعليمية" : "Accès complet à tous les contenus pédagogiques"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
              {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{isAr ? "الأكثر شعبية" : "Populaire"}</Badge>}
              <CardHeader className="text-center pb-3">
                <Badge variant="outline" className="mb-2 w-fit mx-auto">{plan.period === "monthly" ? (isAr ? "شهري" : "Mensuel") : (isAr ? "سنوي" : "Annuel")}</Badge>
                <CardTitle className="text-base">{isAr ? (plan.role === "STUDENT" ? "خطة الطالب" : "خطة المعلم") : (plan.role === "STUDENT" ? "Plan Élève" : "Plan Enseignant")}</CardTitle>
                <div className="mt-3"><span className="text-3xl font-bold">{plan.price}</span><span className="text-muted-foreground"> TND{plan.period === "monthly" ? (isAr ? "/شهر" : "/mois") : (isAr ? "/سنة" : "/an")}</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{features[f] || f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/checkout?plan=${plan.id}`}>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>{isAr ? "اشترك الآن" : "S'abonner"}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
