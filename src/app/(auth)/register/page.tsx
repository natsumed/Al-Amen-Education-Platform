"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { useLanguage } from "@/providers/language-provider"
import { Loader2, User, Mail, Phone, Lock } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Registration failed")
      toast.success(isAr ? "تم إنشاء الحساب بنجاح!" : "Compte créé avec succès!")
      router.push("/login")
    } catch (e: any) {
      toast.error(e.message || (isAr ? "حدث خطأ" : "Une erreur est survenue"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-2xl shadow-primary/5">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{isAr ? "إنشاء حساب" : "Créer un compte"}</CardTitle>
        <CardDescription>{isAr ? "انضم إلى أمان الله مجاناً" : "Rejoignez Amenallah gratuitement"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? "الاسم الكامل" : "Nom complet"}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={isAr ? "محمد بن علي" : "Mohamed Ben Ali"} className="pl-10" {...register("fullName")} />
            </div>
            {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder={isAr ? "بريدك@الإلكتروني.com" : "votre@email.com"} className="pl-10" {...register("email")} />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "الهاتف (اختياري)" : "Téléphone (optionnel)"}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="tel" placeholder="+216 XX XXX XXX" className="pl-10" {...register("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "أنا" : "Je suis"}</Label>
            <Select onValueChange={(v) => setValue("role", v as any)} defaultValue="STUDENT">
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر دورك" : "Sélectionner votre rôle"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">{isAr ? "تلميذ(ة)" : "Élève"}</SelectItem>
                <SelectItem value="TEACHER">{isAr ? "معلم(ة)" : "Enseignant(e)"}</SelectItem>
                <SelectItem value="PARENT">{isAr ? "ولي أمر" : "Parent"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "كلمة المرور" : "Mot de passe"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-10" {...register("password")} />
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isAr ? "إنشاء حسابي" : "Créer mon compte"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isAr ? "لديك حساب بالفعل؟ " : "Déjà un compte? "}
            <Link href="/login" className="text-primary font-medium hover:underline">{isAr ? "تسجيل الدخول" : "Se connecter"}</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
