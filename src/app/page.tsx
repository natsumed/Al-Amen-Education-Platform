"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/providers/language-provider"
import { BookOpen, Video, Zap, Users, ChevronRight, Shield, Download, Globe, GraduationCap, Sparkles } from "lucide-react"

const FEATURES = [
  { icon: Video, titleFr: "Cours vidéo", titleAr: "دروس فيديو", descFr: "Des centaines de cours vidéo pour toutes les matières du primaire.", descAr: "مئات الدروس المصورة لجميع مواد التعليم الابتدائي." },
  { icon: BookOpen, titleFr: "Livres & Séries", titleAr: "كتب وسلاسل", descFr: "Téléchargez les livres et séries d'exercices au format PDF.", descAr: "حمّل الكتب وسلاسل التمارين بصيغة PDF." },
  { icon: Zap, titleFr: "Animations", titleAr: "رسوم متحركة", descFr: "Des animations éducatives captivantes pour les enseignants.", descAr: "رسوم متحركة تعليمية شيّقة للمعلمين." },
  { icon: Users, titleFr: "Suivi parental", titleAr: "متابعة الوالدين", descFr: "Les parents suivent la progression de leurs enfants.", descAr: "يتابع الوالدان تقدم أبنائهم." },
  { icon: Shield, titleFr: "Contenu vérifié", titleAr: "محتوى موثوق", descFr: "Contenu adapté au programme tunisien, vérifié par des experts.", descAr: "محتوى مناسب للبرنامج التونسي، تمت مراجعته من قبل خبراء." },
  { icon: GraduationCap, titleFr: "6 années scolaires", titleAr: "6 سنوات دراسية", descFr: "De la 1ère à la 6ème année, toutes les matières couvertes.", descAr: "من السنة الأولى إلى السادسة، جميع المواد مغطاة." },
]

export default function HomePage() {
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
              {isAr ? "أ" : "A"}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">{isAr ? "الأمان" : "Al-Amân"}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{isAr ? "دارالأمان للنشر" : "Éditions Al-Amân"}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(isAr ? "fr" : "ar")}
              className="gap-1.5"
            >
              <Globe className="h-3.5 w-3.5" />
              {isAr ? "FR" : "عربي"}
            </Button>
            <Link href="/content/browse">
              <Button variant="ghost" size="sm">{isAr ? "تصفح" : "Explorer"}</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">{isAr ? "الأسعار" : "Tarifs"}</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">{isAr ? "دخول" : "Connexion"}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "تسجيل" : "S'inscrire"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container relative text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15" variant="outline">
              <Sparkles className="h-3 w-3 mr-1.5" />
              {isAr ? "منصة تعليمية تونسية — دارالأمان للنشر" : "Plateforme éducative tunisienne — Éditions Al-Amân"}
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              {isAr ? "تعلّم وانجح" : "Apprends et"}<br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {isAr ? "في المرحلة الابتدائية" : "réussis au primaire"}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "دروس فيديو وكتب وتمارين لجميع سنوات التعليم الابتدائي في تونس — بالعربية والفرنسية"
                : "Des cours vidéo, livres et exercices pour toutes les années du primaire en Tunisie — en arabe et en français"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
                  {isAr ? "ابدأ مجاناً" : "Commencer gratuitement"}
                  <ChevronRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </Link>
              <Link href="/content/browse">
                <Button size="lg" variant="outline" className="text-base px-8 h-12 border-2">
                  {isAr ? "تصفح المحتوى" : "Explorer le contenu"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
              {isAr ? "كل ما تحتاجه للنجاح" : "Tout ce qu'il faut pour réussir"}
            </h2>
            <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
              {isAr ? "محتوى شامل لجميع المواد والسنوات الدراسية" : "Un contenu complet pour toutes les matières et années scolaires"}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:-translate-y-1 group">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{isAr ? f.titleAr : f.titleFr}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? f.descAr : f.descFr}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "500+", label: isAr ? "دروس فيديو" : "Cours vidéo" },
              { num: "200+", label: isAr ? "كتب PDF" : "Livres PDF" },
              { num: "6", label: isAr ? "سنوات دراسية" : "Années scolaires" },
              { num: "9", label: isAr ? "مواد" : "Matières" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{s.num}</div>
                <div className="text-primary-foreground/80 text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{isAr ? "ابدأ اليوم مجاناً" : "Commencez gratuitement aujourd'hui"}</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              {isAr ? "أنشئ حساباً مجانياً واطلع على المحتوى المجاني فوراً." : "Créez un compte gratuit et accédez immédiatement au contenu gratuit."}
            </p>
            <Link href="/register">
              <Button size="lg" className="px-12 h-12 text-base shadow-lg shadow-primary/25">
                {isAr ? "إنشاء حساب مجاني" : "Créer un compte gratuit"}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {isAr ? "أ" : "A"}
              </div>
              <span className="font-semibold">{isAr ? "الأمان" : "Al-Amân"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 {isAr ? "دارالأمان للنشر" : "Éditions Al-Amân"}. {isAr ? "جميع الحقوق محفوظة." : "Tous droits réservés."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
