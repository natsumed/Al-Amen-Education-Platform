"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { useLanguage } from "@/providers/language-provider"
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

const DASHBOARD_MAP: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
}

export default function LoginPage() {
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const fetchUserRoleAndRedirect = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (!res.ok) throw new Error("Failed to fetch user")
      const data = await res.json()
      const role = data.user?.role ?? "STUDENT"
      router.push(DASHBOARD_MAP[role] ?? "/student")
      router.refresh()
    } catch {
      router.push("/student")
      router.refresh()
    }
  }

  const onSubmit = async (data: LoginInput) => {
    setLoading(true)
    try {
      const result = await signIn("credentials", { ...data, redirect: false })
      if (result?.error) {
        toast.error(isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Email ou mot de passe incorrect")
      } else {
        toast.success(isAr ? "تم تسجيل الدخول بنجاح!" : "Connexion réussie!")
        await fetchUserRoleAndRedirect()
      }
    } catch {
      toast.error(isAr ? "حدث خطأ" : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const result = await signIn("google", { redirect: false })
      if (result?.error) {
        toast.error(isAr ? "تسجيل الدخول عبر جوجل غير متاح حالياً" : "La connexion Google n'est pas disponible actuellement")
      } else if (result?.ok) {
        toast.success(isAr ? "تم تسجيل الدخول بنجاح!" : "Connexion réussie!")
        await fetchUserRoleAndRedirect()
      }
    } catch {
      toast.error(isAr ? "تسجيل الدخول عبر جوجل غير متاح حالياً" : "La connexion Google n'est pas disponible actuellement")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-2xl shadow-primary/5">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{isAr ? "تسجيل الدخول" : "Connexion"}</CardTitle>
        <CardDescription>{isAr ? "ادخل إلى حسابك على الأمان" : "Connectez-vous à votre compte Al-Amân"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder={isAr ? "بريدك@الإلكتروني.com" : "votre@email.com"} className="pl-10" {...register("email")} />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">{isAr ? "كلمة المرور" : "Mot de passe"}</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">{isAr ? "نسيت كلمة المرور؟" : "Mot de passe oublié?"}</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" {...register("password")} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isAr ? "تسجيل الدخول" : "Se connecter"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{isAr ? "أو" : "ou"}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-11" onClick={handleGoogleLogin} disabled={googleLoading}>
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isAr ? "المتابعة مع جوجل" : "Continuer avec Google"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isAr ? "ليس لديك حساب؟ " : "Pas encore de compte? "}
          <Link href="/register" className="text-primary font-medium hover:underline">{isAr ? "إنشاء حساب" : "S'inscrire"}</Link>
        </p>
      </CardContent>
    </Card>
  )
}
