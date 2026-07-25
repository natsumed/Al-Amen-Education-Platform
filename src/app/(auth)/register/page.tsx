"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { useLanguage } from "@/providers/language-provider"
import { Loader2, User, Mail, Phone, Lock, Hash } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "STUDENT" },
  })

  const role = useWatch({ control, name: "role" })

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        const msg =
          typeof result.error === "string"
            ? result.error
            : result.error?.fieldErrors
              ? Object.values(result.error.fieldErrors).flat().join(", ")
              : "Registration failed"
        throw new Error(msg)
      }
      if (result.linkPending) {
        toast.success(
          isAr
            ? "تم إنشاء الحساب! بانتظار قبول التلميذ للربط."
            : "Compte créé ! En attente de l'acceptation de l'élève."
        )
      } else {
        toast.success(isAr ? "تم إنشاء الحساب بنجاح!" : "Compte créé avec succès!")
      }
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
        <CardDescription>
          {isAr ? "انضم إلى أمان الله مجاناً" : "Rejoignez Amenallah gratuitement"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{isAr ? "الاسم الكامل" : "Nom complet"}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "محمد بن علي" : "Mohamed Ben Ali"}
                className="pl-10"
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={isAr ? "بريدك@الإلكتروني.com" : "votre@email.com"}
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
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
            <Select
              onValueChange={(v) => setValue("role", v as RegisterInput["role"], { shouldValidate: true })}
              defaultValue="STUDENT"
            >
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر دورك" : "Sélectionner votre rôle"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">{isAr ? "تلميذ(ة)" : "Élève"}</SelectItem>
                <SelectItem value="TEACHER">
                  {isAr ? "معلم(ة) — للموارد التعليمية" : "Enseignant(e) — ressources pédagogiques"}
                </SelectItem>
                <SelectItem value="PARENT">
                  {isAr ? "ولي أمر — متابعة فقط" : "Parent — suivi uniquement"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "PARENT" && (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <Label>{isAr ? "رقم حساب التلميذ (8 أرقام)" : "N° compte élève (8 chiffres)"}</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 font-mono tracking-wider"
                  placeholder="10000003"
                  maxLength={8}
                  {...register("studentPublicId")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "سيُرسل طلب ربط للتلميذ؛ يجب أن يقبله من مساحته."
                  : "Une invitation sera envoyée à l'élève ; il devra l'accepter depuis son espace."}
              </p>
              {errors.studentPublicId && (
                <p className="text-xs text-destructive">{errors.studentPublicId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{isAr ? "كلمة المرور" : "Mot de passe"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" className="pl-10" {...register("password")} />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isAr ? "إنشاء حسابي" : "Créer mon compte"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isAr ? "لديك حساب بالفعل؟ " : "Déjà un compte? "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {isAr ? "تسجيل الدخول" : "Se connecter"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
