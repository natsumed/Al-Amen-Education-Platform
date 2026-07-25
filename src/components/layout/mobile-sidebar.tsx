"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ChevronDown, Clock, Crown, List } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, BookOpen, Video, Users, CreditCard, BarChart3,
  UserCheck, Library, GraduationCap, Baby, TrendingUp,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

type NavLink = { type: "link"; href: string; icon: LucideIcon; label: string }
type NavGroup = {
  type: "group"
  id: string
  icon: LucideIcon
  label: string
  children: { href: string; icon: LucideIcon; label: string }[]
}
type NavEntry = NavLink | NavGroup

const NAV_FR: Record<string, NavEntry[]> = {
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

const NAV_AR: Record<string, NavEntry[]> = {
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

function MobileNavLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string
  icon: LucideIcon
  label: string
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const roots = ["/admin", "/teacher", "/student", "/parent", "/admin/payments"]
  const active = roots.includes(href)
    ? pathname === href || pathname === `${href}/`
    : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const [paymentsOpen, setPaymentsOpen] = useState(true)
  const pathname = usePathname()
  const { user } = useCurrentUser()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const role = user?.role || "STUDENT"
  const links = (isAr ? NAV_AR : NAV_FR)[role] || []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isAr ? "right" : "left"} className="p-0 w-[280px]">
        <SheetHeader className="p-4 border-b text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <img src="/images/logo.jpeg" alt="" className="w-9 h-9 rounded-xl object-cover" />
            <span>{isAr ? "أمان الله" : "Amenallah"}</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((entry) => {
            if (entry.type === "group") {
              return (
                <div key={entry.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setPaymentsOpen((v) => !v)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium",
                      pathname.startsWith("/admin/payments")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <entry.icon className="h-4 w-4" />
                    <span className="flex-1 text-start">{entry.label}</span>
                    <ChevronDown className={cn("h-4 w-4", paymentsOpen && "rotate-180")} />
                  </button>
                  {paymentsOpen &&
                    entry.children.map((child) => (
                      <div key={child.href} className="ms-3 border-s ps-2">
                        <MobileNavLink
                          {...child}
                          onNavigate={() => setOpen(false)}
                        />
                      </div>
                    ))}
                </div>
              )
            }
            return (
              <MobileNavLink
                key={entry.href}
                {...entry}
                onNavigate={() => setOpen(false)}
              />
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
