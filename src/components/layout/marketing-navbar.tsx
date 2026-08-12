"use client"

import { useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/providers/language-provider"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  BookOpen,
  Video,
  Zap,
  Users,
  Globe,
  GraduationCap,
  School,
  Newspaper,
  ChevronDown,
  LogOut,
  User,
  MonitorPlay,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"

type Props = {
  solid?: boolean
}

export function MarketingNavbar({ solid }: Props) {
  const { language, setLanguage } = useLanguage()
  const { user } = useCurrentUser()
  const isAr = language === "ar"
  const initials =
    user?.name
      ?.split(" ")
      ?.map((n: string) => n[0])
      ?.join("")
      ?.toUpperCase() || "U"
  const dashboardUrl = user ? `/${user.role?.toLowerCase()}` : "/login"
  const [featuresOpen, setFeaturesOpen] = useState(false)

  const featureCols = [
    {
      title: isAr ? "المحتوى" : "Contenu",
      items: [
        {
          href: "/content/browse?type=COURSE",
          icon: Video,
          title: isAr ? "دروس فيديو" : "Cours vidéo",
          desc: isAr ? "مئات الدروس المصورة" : "Des centaines de leçons",
        },
        {
          href: "/content/browse?type=BOOK",
          icon: BookOpen,
          title: isAr ? "كتب وPDF" : "Livres & PDF",
          desc: isAr ? "سلاسل وتمارين" : "Séries et exercices",
        },
        {
          href: "/content/browse?type=SERIES",
          icon: MonitorPlay,
          title: isAr ? "تكوينات" : "Formations",
          desc: isAr ? "مسارات كاملة" : "Parcours complets",
        },
      ],
    },
    {
      title: isAr ? "لمن؟" : "Pour qui ?",
      items: [
        {
          href: "/content/browse?for=student",
          icon: GraduationCap,
          title: isAr ? "للتلاميذ" : "Pour les élèves",
          desc: isAr ? "السنوات 1–6" : "Années 1 à 6",
        },
        {
          href: "/content/browse?for=teacher",
          icon: School,
          title: isAr ? "للمعلمين" : "Pour les enseignants",
          desc: isAr ? "أدوات الصف" : "Outils de classe",
        },
        {
          href: "/pricing",
          icon: Users,
          title: isAr ? "متابعة الوالدين" : "Suivi parental",
          desc: isAr ? "تابع تقدم ابنك" : "Suivez la progression",
        },
      ],
    },
    {
      title: isAr ? "اكتشف" : "Découvrir",
      items: [
        {
          href: "/content/browse?type=ANIMATION",
          icon: Zap,
          title: isAr ? "رسوم متحركة" : "Animations",
          desc: isAr ? "محتوى تفاعلي" : "Contenu captivant",
        },
        {
          href: "/content/browse?sort=newest",
          icon: Newspaper,
          title: isAr ? "آخر الإصدارات" : "Nouveautés",
          desc: isAr ? "أحدث المحتوى" : "Derniers contenus",
        },
      ],
    },
  ]

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 border-b",
        solid ? "bg-background/95 backdrop-blur-xl" : "bg-background/90 backdrop-blur-xl shadow-sm"
      )}
      dir={isAr ? "rtl" : "ltr"}
      onMouseLeave={() => setFeaturesOpen(false)}
    >
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/images/logo.jpeg"
              alt="Amenallah Edition"
              className="w-10 h-10 rounded-xl object-cover shadow-md"
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg leading-tight">
                {isAr ? "أمان الله" : "Amenallah"}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                featuresOpen
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              )}
              onMouseEnter={() => setFeaturesOpen(true)}
              onClick={() => setFeaturesOpen((v) => !v)}
              aria-expanded={featuresOpen}
            >
              {isAr ? "الميزات" : "Fonctionnalités"}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", featuresOpen && "rotate-180")} />
            </button>
            <Link
              href="/content/browse"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {isAr ? "المحتوى" : "Contenu"}
            </Link>
            <Link
              href="/pricing"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {isAr ? "الأسعار" : "Tarifs"}
            </Link>
            <Link
              href="/download"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {isAr ? "تطبيق أندرويد" : "App Android"}
            </Link>
            <Link
              href="/content/browse?sort=newest"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {isAr ? "جديد" : "Nouveautés"}
            </Link>
            <a
              href="#about"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
            >
              {isAr ? "من نحن" : "À propos"}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ModeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(isAr ? "fr" : "ar")}
            className="gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "FR" : "عربي"}</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={dashboardUrl}>
                    <User className="h-4 w-4 mr-2" />
                    {isAr ? "مساحتي" : "Mon espace"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isAr ? "تسجيل الخروج" : "Se déconnecter"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  {isAr ? "دخول" : "Connexion"}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-full px-4">
                  {isAr ? "إنشاء حساب" : "S'inscrire"}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {featuresOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-16 border-b bg-background shadow-soft"
            onMouseEnter={() => setFeaturesOpen(true)}
          >
            <div className="container py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              {featureCols.map((col) => (
                <div key={col.title} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.title}
                  </p>
                  <ul className="space-y-1">
                    {col.items.map((item) => (
                      <li key={item.href + item.title}>
                        <Link
                          href={item.href}
                          className="flex gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                          onClick={() => setFeaturesOpen(false)}
                        >
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="rounded-2xl bg-foreground text-background p-5 flex flex-col justify-between min-h-[180px]">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-70 mb-2">
                    {isAr ? "دليل" : "Guide"}
                  </p>
                  <p className="text-lg font-semibold leading-snug">
                    {isAr ? "اختر مسارك: تلميذ أو معلم" : "Choisissez votre parcours"}
                  </p>
                  <p className="text-sm opacity-70 mt-2">
                    {isAr
                      ? "استكشف المحتوى المناسب لدورك."
                      : "Explorez le contenu adapté à votre rôle."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Link
                    href="/content/browse?for=student"
                    onClick={() => setFeaturesOpen(false)}
                    className="inline-flex items-center justify-between rounded-full bg-background text-foreground px-4 py-2 text-sm font-medium"
                  >
                    {isAr ? "محتوى التلاميذ" : "Contenu élèves"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/content/browse?for=teacher"
                    onClick={() => setFeaturesOpen(false)}
                    className="inline-flex items-center justify-between rounded-full border border-background/30 px-4 py-2 text-sm font-medium"
                  >
                    {isAr ? "محتوى المعلمين" : "Contenu enseignants"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
