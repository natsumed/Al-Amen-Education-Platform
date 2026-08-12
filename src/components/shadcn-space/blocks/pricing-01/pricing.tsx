"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { PRICING_PLANS } from "@/types"
import { useLanguage } from "@/providers/language-provider"
import { ArrowUpRight, Check } from "lucide-react"
import { motion } from "framer-motion"

const FEATURES_FR: Record<string, string> = {
  allVideos: "Tous les cours vidéo",
  allPDFs: "Tous les livres PDF",
  downloadAll: "Téléchargement illimité",
  progressTracking: "Suivi de progression",
  parentMonitoring: "Suivi parental",
  animations: "Animations éducatives",
  classroomTools: "Outils de classe",
  twoMonthsFree: "2 mois offerts",
}

const FEATURES_AR: Record<string, string> = {
  allVideos: "جميع دروس الفيديو",
  allPDFs: "جميع كتب PDF",
  downloadAll: "تحميل غير محدود",
  progressTracking: "متابعة التقدم",
  parentMonitoring: "متابعة الوالدين",
  animations: "رسوم متحركة",
  classroomTools: "أدوات الفصل",
  twoMonthsFree: "شهران مجاناً",
}

// Pastel tints in light mode; a single clean surface in dark mode
// (the alpha tints turn muddy over dark backgrounds).
const PLAN_BG: Record<string, string> = {
  STUDENT_MONTHLY: "bg-primary/5 dark:bg-card",
  STUDENT_YEARLY: "bg-teal-400/15 dark:bg-card",
  TEACHER_MONTHLY: "bg-amber-400/15 dark:bg-card",
  TEACHER_YEARLY: "bg-violet-400/15 dark:bg-card",
}

export default function Pricing() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const features = isAr ? FEATURES_AR : FEATURES_FR

  const cardVariants = {
    hidden: { opacity: 0, y: 80 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.12, duration: 0.55, ease: "easeInOut" as const },
    }),
  }

  return (
    <section className="bg-background py-10 xl:py-0" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 xl:px-16 lg:py-16 sm:py-12 py-8">
        <div className="flex flex-col gap-8 md:gap-12 justify-center items-center w-full">
          <div className="flex flex-col gap-4 justify-center items-center text-center">
            <Badge variant="outline" className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7">
              {isAr ? "الأسعار" : "Tarifs"}
            </Badge>
            <div className="max-w-xl mx-auto">
              <h2 className="text-foreground text-3xl sm:text-5xl font-semibold tracking-tight">
                {isAr ? "اختر الخطة المناسبة لك" : "Choisissez le plan qui vous convient"}
              </h2>
              <p className="mt-3 text-muted-foreground text-base sm:text-lg">
                {isAr
                  ? "وصول كامل للمحتوى التربوي التونسي — تفعيل يدوي بعد الدفع."
                  : "Accès complet au contenu pédagogique tunisien — activation manuelle après paiement."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
            {PRICING_PLANS.map((plan, index) => {
              const roleLabel = isAr
                ? plan.role === "STUDENT"
                  ? "خطة التلميذ"
                  : "خطة المعلم"
                : plan.role === "STUDENT"
                  ? "Plan Élève"
                  : "Plan Enseignant"
              const periodLabel =
                plan.period === "monthly"
                  ? isAr
                    ? "/شهر"
                    : "/mois"
                  : isAr
                    ? "/سنة"
                    : "/an"
              const desc =
                plan.period === "yearly"
                  ? isAr
                    ? "الأفضل قيمة — شهران مجاناً تقريباً"
                    : "Meilleur rapport — environ 2 mois offerts"
                  : isAr
                    ? "مرونة شهرية بدون التزام طويل"
                    : "Flexibilité mensuelle sans long engagement"

              return (
                <motion.div
                  key={plan.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={index}
                  className="w-full"
                >
                  <Card
                    className={cn(
                      PLAN_BG[plan.id] || "bg-muted/40",
                      "p-6 sm:p-8 rounded-2xl border-0 ring-1 ring-border/60 shadow-soft relative overflow-hidden h-full",
                      plan.popular && "ring-2 ring-primary"
                    )}
                  >
                    {plan.popular && (
                      <Badge className="absolute top-4 end-4">
                        {isAr ? "الأكثر شعبية" : "Populaire"}
                      </Badge>
                    )}
                    <CardContent className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start self-stretch px-0 h-full w-full">
                      <div className="flex flex-col items-start justify-between self-stretch gap-6 min-w-[11rem]">
                        <div className="flex flex-col gap-3">
                          <Badge className="py-1 px-3 text-sm font-normal leading-5 w-fit h-7">
                            {roleLabel}
                          </Badge>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {plan.period === "monthly"
                              ? isAr
                                ? "شهري"
                                : "Mensuel"
                              : isAr
                                ? "سنوي"
                                : "Annuel"}
                          </p>
                          <p className="text-sm font-normal text-muted-foreground max-w-56">
                            {desc}
                          </p>
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-4xl sm:text-5xl font-semibold text-card-foreground flex items-end gap-1">
                            {plan.price}
                            <span className="text-base font-normal text-muted-foreground mb-1">
                              TND{periodLabel}
                            </span>
                          </p>
                          <Button
                            asChild
                            className="relative bg-white hover:bg-white text-slate-900 text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden border shadow-sm"
                          >
                            <Link href={`/checkout?plan=${plan.id}`}>
                              <span className="relative z-10 transition-all duration-500">
                                {isAr ? "اشترك الآن" : "S'abonner"}
                              </span>
                              <div className="absolute end-1 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:end-auto group-hover:start-1 group-hover:rotate-45">
                                <ArrowUpRight size={16} />
                              </div>
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="hidden sm:block h-auto self-stretch" />
                      <Separator orientation="horizontal" className="sm:hidden block w-full" />
                      <div className="flex flex-col items-start gap-3 grow">
                        <p className="text-card-foreground text-base sm:text-xl font-medium">
                          {isAr ? "المميزات" : "Fonctionnalités"}
                        </p>
                        <ul className="flex flex-col items-start self-stretch gap-3">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-3 text-card-foreground text-sm sm:text-base font-normal"
                            >
                              <Check size={16} className="text-primary shrink-0" aria-hidden="true" />
                              {features[feature] || feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
