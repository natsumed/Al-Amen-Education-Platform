"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BookOpen, Video, Users, CreditCard, Settings,
  BarChart3, UserCheck, Library, GraduationCap, Baby, TrendingUp
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

const NAV_LINKS_FR: Record<string, NavItemProps[]> = {
  ADMIN: [
    { href: "/admin", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/admin/content", icon: Video, label: "Contenus" },
    { href: "/admin/users", icon: Users, label: "Utilisateurs" },
    { href: "/admin/payments", icon: CreditCard, label: "Paiements" },
    { href: "/admin/manual-activation", icon: UserCheck, label: "Activation manuelle" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytiques" },
  ],
  TEACHER: [
    { href: "/teacher", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/teacher/browse", icon: BookOpen, label: "Explorer" },
    { href: "/teacher/library", icon: Library, label: "Ma bibliothèque" },
    { href: "/teacher/subscription", icon: CreditCard, label: "Abonnement" },
  ],
  STUDENT: [
    { href: "/student", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/student/browse", icon: BookOpen, label: "Explorer" },
    { href: "/student/my-courses", icon: GraduationCap, label: "Mes cours" },
    { href: "/student/progress", icon: TrendingUp, label: "Ma progression" },
    { href: "/student/subscription", icon: CreditCard, label: "Abonnement" },
  ],
  PARENT: [
    { href: "/parent", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/parent/children", icon: Baby, label: "Mes enfants" },
  ],
}

const NAV_LINKS_AR: Record<string, NavItemProps[]> = {
  ADMIN: [
    { href: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
    { href: "/admin/content", icon: Video, label: "المحتويات" },
    { href: "/admin/users", icon: Users, label: "المستخدمون" },
    { href: "/admin/payments", icon: CreditCard, label: "المدفوعات" },
    { href: "/admin/manual-activation", icon: UserCheck, label: "التفعيل اليدوي" },
    { href: "/admin/analytics", icon: BarChart3, label: "الإحصائيات" },
  ],
  TEACHER: [
    { href: "/teacher", icon: LayoutDashboard, label: "لوحة التحكم" },
    { href: "/teacher/browse", icon: BookOpen, label: "تصفح" },
    { href: "/teacher/library", icon: Library, label: "مكتبتي" },
    { href: "/teacher/subscription", icon: CreditCard, label: "الاشتراك" },
  ],
  STUDENT: [
    { href: "/student", icon: LayoutDashboard, label: "لوحة التحكم" },
    { href: "/student/browse", icon: BookOpen, label: "تصفح" },
    { href: "/student/my-courses", icon: GraduationCap, label: "دروسي" },
    { href: "/student/progress", icon: TrendingUp, label: "تقدمي" },
    { href: "/student/subscription", icon: CreditCard, label: "الاشتراك" },
  ],
  PARENT: [
    { href: "/parent", icon: LayoutDashboard, label: "لوحة التحكم" },
    { href: "/parent/children", icon: Baby, label: "أطفالي" },
  ],
}

export function Sidebar() {
  const { user } = useCurrentUser()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const role = user?.role || "STUDENT"
  const links = isAr ? (NAV_LINKS_AR[role] || []) : (NAV_LINKS_FR[role] || [])

  return (
    <aside className="w-64 min-h-screen bg-background border-r flex flex-col py-4 px-3 hidden md:flex">
      <Link href="/" className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
          {isAr ? "أ" : "A"}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base leading-tight">{isAr ? "الأمان" : "Al-Amân"}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{isAr ? "دارالأمان للنشر" : "Éditions Al-Amân"}</span>
        </div>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map((link) => <NavItem key={link.href} {...link} />)}
      </nav>
      <div className="mt-auto pt-4 border-t px-3">
        <div className="text-sm font-medium truncate">{user?.name ?? user?.email}</div>
        <div className="text-xs text-muted-foreground">{isAr ? ({ ADMIN: "مدير", TEACHER: "معلم", STUDENT: "تلميذ", PARENT: "ولي أمر" } as Record<string, string>)[role] : role}</div>
      </div>
    </aside>
  )
}
