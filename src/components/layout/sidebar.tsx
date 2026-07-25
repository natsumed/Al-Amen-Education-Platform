"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BookOpen, Video, Users, CreditCard,
  BarChart3, UserCheck, Library, GraduationCap, Baby, TrendingUp,
  ChevronDown, Clock, Crown, List,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface NavItemProps {
  href: string
  icon: LucideIcon
  label: string
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname()
  const rootPaths = ["/admin", "/teacher", "/student", "/parent", "/admin/payments"]
  const finalActive = rootPaths.includes(href)
    ? pathname === href || pathname === `${href}/`
    : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
      finalActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}

type NavEntry =
  | { type: "link"; href: string; icon: LucideIcon; label: string }
  | {
      type: "group"
      id: string
      icon: LucideIcon
      label: string
      children: { href: string; icon: LucideIcon; label: string }[]
    }

const NAV_LINKS_FR: Record<string, NavEntry[]> = {
  ADMIN: [
    { type: "link", href: "/admin", icon: LayoutDashboard, label: "Tableau de bord" },
    { type: "link", href: "/admin/content", icon: Video, label: "Contenus" },
    { type: "link", href: "/admin/users", icon: Users, label: "Utilisateurs" },
    {
      type: "group",
      id: "payments",
      icon: CreditCard,
      label: "Paiements",
      children: [
        { href: "/admin/payments", icon: List, label: "Tous" },
        { href: "/admin/payments/pending", icon: Clock, label: "En attente" },
        { href: "/admin/payments/premium", icon: Crown, label: "Comptes premium" },
        { href: "/admin/payments/manual", icon: UserCheck, label: "Activation manuelle" },
      ],
    },
    { type: "link", href: "/admin/analytics", icon: BarChart3, label: "Analytiques" },
  ],
  TEACHER: [
    { type: "link", href: "/teacher", icon: LayoutDashboard, label: "Tableau de bord" },
    { type: "link", href: "/teacher/browse", icon: BookOpen, label: "Explorer" },
    { type: "link", href: "/teacher/library", icon: Library, label: "Ma bibliothèque" },
    { type: "link", href: "/teacher/subscription", icon: CreditCard, label: "Abonnement" },
  ],
  STUDENT: [
    { type: "link", href: "/student", icon: LayoutDashboard, label: "Tableau de bord" },
    { type: "link", href: "/student/browse", icon: BookOpen, label: "Explorer" },
    { type: "link", href: "/student/my-courses", icon: GraduationCap, label: "Mes cours" },
    { type: "link", href: "/student/progress", icon: TrendingUp, label: "Ma progression" },
    { type: "link", href: "/student/subscription", icon: CreditCard, label: "Abonnement" },
  ],
  PARENT: [
    { type: "link", href: "/parent", icon: LayoutDashboard, label: "Tableau de bord" },
    { type: "link", href: "/parent/children", icon: Baby, label: "Mes enfants" },
    { type: "link", href: "/parent/pay", icon: CreditCard, label: "Payer pour un enfant" },
  ],
}

const NAV_LINKS_AR: Record<string, NavEntry[]> = {
  ADMIN: [
    { type: "link", href: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
    { type: "link", href: "/admin/content", icon: Video, label: "المحتويات" },
    { type: "link", href: "/admin/users", icon: Users, label: "المستخدمون" },
    {
      type: "group",
      id: "payments",
      icon: CreditCard,
      label: "المدفوعات",
      children: [
        { href: "/admin/payments", icon: List, label: "الكل" },
        { href: "/admin/payments/pending", icon: Clock, label: "قيد الانتظار" },
        { href: "/admin/payments/premium", icon: Crown, label: "حسابات مميزة" },
        { href: "/admin/payments/manual", icon: UserCheck, label: "تفعيل يدوي" },
      ],
    },
    { type: "link", href: "/admin/analytics", icon: BarChart3, label: "الإحصائيات" },
  ],
  TEACHER: [
    { type: "link", href: "/teacher", icon: LayoutDashboard, label: "لوحة التحكم" },
    { type: "link", href: "/teacher/browse", icon: BookOpen, label: "تصفح" },
    { type: "link", href: "/teacher/library", icon: Library, label: "مكتبتي" },
    { type: "link", href: "/teacher/subscription", icon: CreditCard, label: "الاشتراك" },
  ],
  STUDENT: [
    { type: "link", href: "/student", icon: LayoutDashboard, label: "لوحة التحكم" },
    { type: "link", href: "/student/browse", icon: BookOpen, label: "تصفح" },
    { type: "link", href: "/student/my-courses", icon: GraduationCap, label: "دروسي" },
    { type: "link", href: "/student/progress", icon: TrendingUp, label: "تقدمي" },
    { type: "link", href: "/student/subscription", icon: CreditCard, label: "الاشتراك" },
  ],
  PARENT: [
    { type: "link", href: "/parent", icon: LayoutDashboard, label: "لوحة التحكم" },
    { type: "link", href: "/parent/children", icon: Baby, label: "أطفالي" },
    { type: "link", href: "/parent/pay", icon: CreditCard, label: "الدفع لابن" },
  ],
}

function NavGroup({
  entry,
}: {
  entry: Extract<NavEntry, { type: "group" }>
}) {
  const pathname = usePathname()
  const childActive = entry.children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  )
  const [open, setOpen] = useState(childActive || pathname.startsWith("/admin/payments"))
  const Icon = entry.icon

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          childActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate flex-1 text-start">{entry.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ms-3 space-y-0.5 border-s ps-2">
          {entry.children.map((child) => (
            <NavItem key={child.href} {...child} />
          ))}
        </div>
      )}
    </div>
  )
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
        <img src="/images/logo.jpeg" alt="Amenallah Edition" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
        <div className="flex flex-col">
          <span className="font-bold text-base leading-tight">{isAr ? "أمان الله" : "Amenallah"}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}</span>
        </div>
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map((entry) =>
          entry.type === "group" ? (
            <NavGroup key={entry.id} entry={entry} />
          ) : (
            <NavItem key={entry.href} href={entry.href} icon={entry.icon} label={entry.label} />
          )
        )}
      </nav>
      <div className="mt-auto pt-4 border-t px-3">
        <div className="text-sm font-medium truncate">{user?.name ?? user?.email}</div>
        <div className="text-xs text-muted-foreground">{isAr ? ({ ADMIN: "مدير", TEACHER: "معلم", STUDENT: "تلميذ", PARENT: "ولي أمر" } as Record<string, string>)[role] : role}</div>
      </div>
    </aside>
  )
}
