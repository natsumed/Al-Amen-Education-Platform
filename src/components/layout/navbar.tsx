"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Globe } from "lucide-react"

export function Navbar() {
  const { user } = useCurrentUser()
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"
  const initials = user?.name?.split(" ")?.map((n: string) => n[0])?.join("")?.toUpperCase() || "U"

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {isAr ? "أ" : "A"}
        </div>
        <span className="font-semibold text-lg hidden sm:inline">{isAr ? "الأمان" : "Al-Amân"}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(isAr ? "fr" : "ar")}
          className="gap-1.5"
        >
          <Globe className="h-3.5 w-3.5" />
          {isAr ? "FR" : "عربي"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/profile"><User className="h-4 w-4 mr-2" />{isAr ? "ملفي الشخصي" : "Mon profil"}</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings"><Settings className="h-4 w-4 mr-2" />{isAr ? "الإعدادات" : "Paramètres"}</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4 mr-2" />{isAr ? "تسجيل الخروج" : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
