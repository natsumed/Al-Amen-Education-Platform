"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/providers/language-provider"
import {
  BookOpen, Video, Zap, Users, ChevronRight, Shield, Globe,
  GraduationCap, Sparkles, School, MonitorPlay, Newspaper,
  Heart, Star, Smile, Target, Award, Clock, BookMarked, Palette,
  ArrowRight, Play, CheckCircle
} from "lucide-react"

const FEATURES = [
  { icon: Video, titleFr: "Cours vidéo", titleAr: "دروس فيديو", descFr: "Des centaines de cours vidéo pour toutes les matières du primaire.", descAr: "مئات الدروس المصورة لجميع مواد التعليم الابتدائي.", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
  { icon: BookOpen, titleFr: "Livres & Séries", titleAr: "كتب وسلاسل", descFr: "Téléchargez les livres et séries d'exercices au format PDF.", descAr: "حمّل الكتب وسلاسل التمارين بصيغة PDF.", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
  { icon: MonitorPlay, titleFr: "Formations", titleAr: "تكوينات", descFr: "Des formations complètes pour maîtriser chaque matière du programme officiel.", descAr: "تكوينات شاملة لإتقان كل مادة من البرنامج الرسمي.", color: "from-violet-500 to-violet-600", bg: "bg-violet-50" },
  { icon: Zap, titleFr: "Animations", titleAr: "رسوم متحركة", descFr: "Des animations éducatives captivantes pour les enseignants.", descAr: "رسوم متحركة تعليمية شيّقة للمعلمين.", color: "from-amber-500 to-amber-600", bg: "bg-amber-50" },
  { icon: Users, titleFr: "Suivi parental", titleAr: "متابعة الوالدين", descFr: "Les parents suivent la progression de leurs enfants.", descAr: "يتابع الوالدان تقدم أبنائهم.", color: "from-rose-500 to-rose-600", bg: "bg-rose-50" },
  { icon: Shield, titleFr: "Contenu vérifié", titleAr: "محتوى موثوق", descFr: "Contenu adapté au programme tunisien, vérifié par des experts.", descAr: "محتوى مناسب للبرنامج التونسي، تمت مراجعته من قبل خبراء.", color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50" },
  { icon: GraduationCap, titleFr: "6 années scolaires", titleAr: "6 سنوات دراسية", descFr: "De la 1ère à la 6ème année, toutes les matières couvertes.", descAr: "من السنة الأولى إلى السادسة، جميع المواد مغطاة.", color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50" },
]

const ABOUT_POINTS = [
  { icon: Target, titleFr: "Notre mission", titleAr: "مهمتنا", descFr: "Offrir une éducation de qualité accessible à tous les élèves tunisiens du primaire.", descAr: "توفير تعليم جيد ومتاح لجميع التلاميذ التونسيين في المرحلة الابتدائية." },
  { icon: Award, titleFr: "Expertise", titleAr: "خبرتنا", descFr: "Une équipe d'enseignants expérimentés et de pédagogues passionnés.", descAr: "فريق من المعلمين ذوي الخبرة والمربين الشغوفين." },
  { icon: Heart, titleFr: "Nos valeurs", titleAr: "قيمنا", descFr: "Excellence, innovation et bienveillance au cœur de chaque contenu.", descAr: "التميز والابتكار واللطف في قلب كل محتوى." },
  { icon: Clock, titleFr: "Disponible 24/7", titleAr: "متاح 24/7", descFr: "Apprenez à votre rythme, quand vous voulez, où vous voulez.", descAr: "تعلّم حسب وتيرتك، متى تريد وأينما كنت." },
]

export default function HomePage() {
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"

  return (
    <div className="min-h-screen bg-background overflow-x-hidden" dir={isAr ? "rtl" : "ltr"}>
      {/* ======= NAVBAR ======= */}
      <nav className="border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/profile.php?id=100064329450686" target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src="/images/logo.jpeg" alt="Amenallah Edition" className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow cursor-pointer" />
            </a>
            <Link href="/" className="flex-col hidden sm:flex">
              <span className="font-bold text-lg leading-tight">{isAr ? "أمان الله" : "Amenallah"}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}</span>
            </Link>
            <div className="hidden lg:flex items-center gap-1.5 ml-3 pl-3 border-l">
              <Link href="/content/browse?for=student">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {isAr ? "تلميذ" : "Élève"}
                </Button>
              </Link>
              <Link href="/content/browse?for=teacher">
                <Button variant="outline" size="sm" className="gap-1.5 rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all">
                  <School className="h-3.5 w-3.5" />
                  {isAr ? "معلم" : "Enseignant"}
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setLanguage(isAr ? "fr" : "ar")} className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isAr ? "FR" : "عربي"}</span>
            </Button>
            <Link href="/content/browse" className="hidden md:block">
              <Button variant="ghost" size="sm">{isAr ? "تصفح" : "Explorer"}</Button>
            </Link>
            <Link href="/pricing" className="hidden md:block">
              <Button variant="ghost" size="sm">{isAr ? "الأسعار" : "Tarifs"}</Button>
            </Link>
            <Link href="/content/browse?sort=newest" className="hidden md:block">
              <Button variant="ghost" size="sm" className="gap-1">
                <Newspaper className="h-3.5 w-3.5" />
                {isAr ? "آخر الإصدارات" : "Nouveautés"}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">{isAr ? "دخول" : "Connexion"}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5 shadow-md shadow-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isAr ? "تسجيل" : "S'inscrire"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ======= HERO ======= */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-[5%] w-80 h-80 bg-amber-400/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
        />

        {/* Floating decorative icons */}
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-20 left-[15%] opacity-30 hidden lg:block">
          <BookOpen className="h-16 w-16 text-primary" />
        </motion.div>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute top-40 right-[10%] opacity-30 hidden lg:block">
          <Star className="h-12 w-12 text-amber-500" />
        </motion.div>
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} className="absolute bottom-32 left-[20%] opacity-25 hidden lg:block">
          <Palette className="h-14 w-14 text-purple-500" />
        </motion.div>
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }} className="absolute bottom-40 right-[15%] opacity-25 hidden lg:block">
          <Smile className="h-10 w-10 text-emerald-500" />
        </motion.div>

        <div className="container relative text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 text-sm px-5 py-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 rounded-full" variant="outline">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {isAr ? "منصة تعليمية تونسية — أمان الله للنشر و التوزيع" : "Plateforme éducative tunisienne — Amenallah Edition"}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              {isAr ? "تعلّم وانجح" : "Apprends et"}{" "}
              <br />
              <span className="bg-gradient-to-r from-primary via-[#6c5ce7] to-[#e17055] bg-clip-text text-transparent">
                {isAr ? "في المرحلة الابتدائية" : "réussis au primaire"}
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "دروس فيديو وكتب وتمارين لجميع سنوات التعليم الابتدائي في تونس — بالعربية والفرنسية"
                : "Des cours vidéo, livres et exercices pour toutes les années du primaire en Tunisie — en arabe et en français"}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="gap-2 text-base px-10 h-14 rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-all hover:-translate-y-0.5">
                  {isAr ? "ابدأ مجاناً" : "Commencer gratuitement"}
                  <ChevronRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} />
                </Button>
              </Link>
              <Link href="/content/browse">
                <Button size="lg" variant="outline" className="text-base px-10 h-14 rounded-full border-2 hover:bg-primary/5 transition-all gap-2">
                  <Play className="h-5 w-5" />
                  {isAr ? "تصفح المحتوى" : "Explorer le contenu"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-auto">
            <path d="M0 50C120 80 240 20 360 40C480 60 600 30 720 35C840 40 960 70 1080 45C1200 20 1320 60 1440 35V100H0V50Z" className="fill-white" />
          </svg>
        </div>
      </section>

      {/* ======= LOGO SHOWCASE ======= */}
      <section className="py-16 bg-white relative">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block"
          >
            <a href="https://www.facebook.com/profile.php?id=100064329450686" target="_blank" rel="noopener noreferrer">
              <img
                src="/images/logo.jpeg"
                alt="Amenallah Edition"
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover shadow-2xl shadow-primary/25 mx-auto hover:scale-105 transition-transform duration-300 cursor-pointer"
              />
            </a>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-6 mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {isAr
                ? "دار النشر الرائدة في تونس للمحتوى التعليمي الرقمي والمطبوع"
                : "La maison d'édition leader en Tunisie pour le contenu éducatif numérique et imprimé"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ======= FEATURES ======= */}
      <section className="py-24 bg-slate-50/50">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary border-primary/20" variant="outline">
              {isAr ? "لماذا نحن؟" : "Pourquoi nous ?"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {isAr ? "كل ما تحتاجه للنجاح" : "Tout ce qu'il faut pour réussir"}
            </h2>
            <p className="text-muted-foreground mb-16 max-w-xl mx-auto text-lg">
              {isAr ? "محتوى شامل لجميع المواد والسنوات الدراسية" : "Un contenu complet pour toutes les matières et années scolaires"}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-2 group rounded-2xl overflow-hidden h-full">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${f.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <f.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{isAr ? f.titleAr : f.titleFr}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? f.descAr : f.descFr}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= ILLUSTRATION BREAK ======= */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-amber-400/5 to-emerald-400/5 relative overflow-hidden">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Happy Students */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-center">
              <div className="w-28 h-28 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-lg">
                <Smile className="h-14 w-14 text-amber-600" />
              </div>
              <h3 className="font-bold text-xl mb-1">{isAr ? "تلاميذ سعداء" : "Élèves heureux"}</h3>
              <p className="text-muted-foreground text-sm">{isAr ? "نتعلم ونلعب وننجح معاً" : "Apprendre, jouer et réussir ensemble"}</p>
            </motion.div>

            {/* Logo Center */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
                <BookMarked className="h-16 w-16 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-1">{isAr ? "محتوى تعليمي متميز" : "Contenu éducatif premium"}</h3>
              <p className="text-muted-foreground text-sm">{isAr ? "محتوى معتمد من خبراء التربية" : "Contenu validé par des experts en éducation"}</p>
            </motion.div>

            {/* Happy Teachers */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="text-center">
              <div className="w-28 h-28 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-14 w-14 text-emerald-600" />
              </div>
              <h3 className="font-bold text-xl mb-1">{isAr ? "معلمون مبدعون" : "Enseignants créatifs"}</h3>
              <p className="text-muted-foreground text-sm">{isAr ? "أفضل الموارد لمعلمي الابتدائي" : "Les meilleures ressources pour les enseignants du primaire"}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ======= STATS ======= */}
      <section className="py-20 bg-gradient-to-r from-primary via-[#2d4ae0] to-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-20 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "500+", label: isAr ? "دروس فيديو" : "Cours vidéo", icon: Video },
              { num: "200+", label: isAr ? "كتب PDF" : "Livres PDF", icon: BookOpen },
              { num: "6", label: isAr ? "سنوات دراسية" : "Années scolaires", icon: GraduationCap },
              { num: "9", label: isAr ? "مواد" : "Matières", icon: BookMarked },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1, type: "spring" }}>
                <s.icon className="h-8 w-8 mx-auto mb-3 opacity-70" />
                <div className="text-5xl md:text-6xl font-extrabold mb-2 tracking-tight">{s.num}</div>
                <div className="text-white/70 text-sm font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= ABOUT US ======= */}
      <section className="py-24 bg-white">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary border-primary/20" variant="outline">
              {isAr ? "من نحن" : "À propos"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {isAr ? "عن أمان الله للنشر و التوزيع" : "À propos d'Amenallah Edition"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {isAr
                ? "دار نشر تونسية متخصصة في المحتوى التعليمي الرقمي والمطبوع للمرحلة الابتدائية"
                : "Maison d'édition tunisienne spécialisée dans le contenu éducatif numérique et imprimé pour le primaire"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ABOUT_POINTS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl h-full group hover:-translate-y-1">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <p.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{isAr ? p.titleAr : p.titleFr}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? p.descAr : p.descFr}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* About description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 max-w-3xl mx-auto text-center"
          >
            <div className="bg-gradient-to-r from-primary/5 via-amber-50/50 to-emerald-50/50 rounded-3xl p-8 md:p-10 border border-primary/10">
              <Star className="h-8 w-8 text-amber-500 mx-auto mb-4" />
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? "نحن نؤمن بأن كل طفل يستحق تعليماً جيداً. نقدم محتوى تعليمياً شاملاً بالعربية والفرنسية يغطي جميع مواد المرحلة الابتدائية من السنة الأولى إلى السنة السادسة، مع متابعة شخصية لكل تلميذ."
                  : "Nous croyons que chaque enfant mérite une éducation de qualité. Nous proposons un contenu éducatif complet en arabe et en français couvrant toutes les matières du primaire de la 1ère à la 6ème année, avec un suivi personnalisé pour chaque élève."}
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======= CTA ======= */}
      <section className="py-24 bg-slate-50/50">
        <div className="container text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary border-primary/20" variant="outline">
              {isAr ? "انضم إلينا اليوم" : "Rejoignez-nous aujourd'hui"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
              {isAr ? "ابدأ رحلة التعلم الآن" : "Commencez votre parcours d'apprentissage"}
            </h2>
            <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
              {isAr
                ? "أنشئ حساباً مجانياً واستمتع بمحتوى تعليمي مميز لطفلك."
                : "Créez un compte gratuit et profitez d'un contenu éducatif de qualité pour votre enfant."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?role=STUDENT">
                <Button size="lg" className="px-10 h-14 text-base rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 gap-2 bg-gradient-to-r from-primary to-primary/90">
                  <GraduationCap className="h-5 w-5" />
                  {isAr ? "حساب تلميذ مجاني" : "Compte Élève gratuit"}
                </Button>
              </Link>
              <Link href="/register?role=TEACHER">
                <Button size="lg" variant="outline" className="px-10 h-14 text-base rounded-full border-2 hover:bg-primary/5 transition-all gap-2">
                  <School className="h-5 w-5" />
                  {isAr ? "حساب معلم مجاني" : "Compte Enseignant gratuit"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======= FOOTER ======= */}
      <footer className="border-t py-12 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/profile.php?id=100064329450686" target="_blank" rel="noopener noreferrer">
                <img src="/images/logo.jpeg" alt="Amenallah Edition" className="w-10 h-10 rounded-lg object-cover hover:shadow-lg transition-shadow cursor-pointer" />
              </a>
              <div className="flex flex-col">
                <span className="font-bold">{isAr ? "أمان الله" : "Amenallah"}</span>
                <span className="text-xs text-muted-foreground">{isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}</span>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/content/browse" className="hover:text-primary transition-colors">{isAr ? "تصفح" : "Explorer"}</Link>
              <Link href="/pricing" className="hover:text-primary transition-colors">{isAr ? "الأسعار" : "Tarifs"}</Link>
              <Link href="/login" className="hover:text-primary transition-colors">{isAr ? "دخول" : "Connexion"}</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 {isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}. {isAr ? "جميع الحقوق محفوظة." : "Tous droits réservés."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
