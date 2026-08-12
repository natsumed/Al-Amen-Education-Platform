"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/providers/language-provider"
import { Loader2, Copy, Upload, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { ModeToggle } from "@/components/mode-toggle"

type MeUser = {
  id: string
  publicId: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string | null
  phone?: string | null
  preferredLanguage?: string | null
  emailNotifications?: boolean
}

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage()
  const { update: updateSession } = useSession()
  const isAr = language === "ar"
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<MeUser | null>(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const load = () => {
    setLoading(true)
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        const u = d.user as MeUser
        setUser(u)
        setFullName(u.fullName || "")
        setPhone(u.phone || "")
        setAvatarUrl(u.avatarUrl || "")
        setEmailNotifications(u.emailNotifications !== false)
        if (u.preferredLanguage === "fr" || u.preferredLanguage === "ar") {
          setLanguage(u.preferredLanguage)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: phone || null,
          avatarUrl: avatarUrl || "",
          preferredLanguage: language,
          emailNotifications,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erreur")
      setUser(data.user)
      if (data.user?.fullName) {
        await updateSession({ name: data.user.fullName, fullName: data.user.fullName })
      }
      toast.success(isAr ? "تم حفظ الإعدادات" : "Paramètres enregistrés")
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return
    const okType = ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
    if (!okType) {
      toast.error(isAr ? "الصيغ المسموحة: JPG أو PNG" : "Formats acceptés : JPG, JPEG ou PNG")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isAr ? "الحجم الأقصى 2 ميغابايت" : "Taille max. 2 Mo")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erreur")
      setAvatarUrl(data.avatarUrl || "")
      if (data.user) setUser(data.user)
      await updateSession({ image: data.avatarUrl || null })
      toast.success(isAr ? "تم تحديث الصورة" : "Photo mise à jour")
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removeAvatar = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: "" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erreur")
      setAvatarUrl("")
      setUser(data.user)
      await updateSession({ image: null })
      toast.success(isAr ? "تمت إزالة الصورة" : "Photo retirée")
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setPwdSaving(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erreur")
      toast.success(isAr ? "تم تغيير كلمة المرور" : "Mot de passe mis à jour")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setPwdSaving(false)
    }
  }

  const setLangAndPersist = async (lang: "fr" | "ar") => {
    setLanguage(lang)
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: lang }),
      })
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen flex bg-mesh">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isAr ? "الإعدادات" : "Paramètres"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isAr
                  ? "الملف الشخصي، الأمان والتفضيلات"
                  : "Profil, sécurité et préférences"}
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                  <TabsTrigger value="profile">{isAr ? "الملف" : "Profil"}</TabsTrigger>
                  <TabsTrigger value="security">{isAr ? "الأمان" : "Sécurité"}</TabsTrigger>
                  <TabsTrigger value="prefs">{isAr ? "التفضيلات" : "Préférences"}</TabsTrigger>
                  <TabsTrigger value="account">{isAr ? "الحساب" : "Compte"}</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                  <Card className="border-0 shadow-soft ring-1 ring-border/60">
                    <CardHeader>
                      <CardTitle>{isAr ? "الملف الشخصي" : "Profil"}</CardTitle>
                      <CardDescription>
                        {isAr ? "الاسم والهاتف والصورة" : "Nom, téléphone et avatar"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>{isAr ? "الاسم الكامل" : "Nom complet"}</Label>
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                      <div>
                        <Label>{isAr ? "الهاتف" : "Téléphone"}</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+216…"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{isAr ? "الصورة الشخصية" : "Photo de profil"}</Label>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                                {(fullName || "?").slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input
                              ref={fileRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={(e) => void onPickAvatar(e.target.files?.[0])}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploading}
                              onClick={() => fileRef.current?.click()}
                            >
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {isAr ? "استيراد صورة" : "Importer une image"}
                            </Button>
                            {avatarUrl ? (
                              <Button
                                type="button"
                                variant="ghost"
                                disabled={saving || uploading}
                                onClick={() => void removeAvatar()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isAr ? "إزالة" : "Retirer"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isAr
                            ? "JPG أو PNG — بحد أقصى 2 ميغابايت"
                            : "JPG, JPEG ou PNG — max. 2 Mo"}
                        </p>
                      </div>
                      <Button onClick={saveProfile} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isAr ? "حفظ" : "Enregistrer"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-4">
                  <Card className="border-0 shadow-soft ring-1 ring-border/60">
                    <CardHeader>
                      <CardTitle>{isAr ? "كلمة المرور" : "Mot de passe"}</CardTitle>
                      <CardDescription>
                        {isAr
                          ? "غيّر كلمة المرور وأنت مسجّل الدخول"
                          : "Changez votre mot de passe en étant connecté"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>{isAr ? "كلمة المرور الحالية" : "Mot de passe actuel"}</Label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{isAr ? "كلمة المرور الجديدة" : "Nouveau mot de passe"}</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{isAr ? "تأكيد" : "Confirmer"}</Label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      <Button onClick={changePassword} disabled={pwdSaving}>
                        {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isAr ? "تحديث كلمة المرور" : "Mettre à jour"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        <Link href="/forgot-password" className="text-primary hover:underline">
                          {isAr ? "نسيت كلمة المرور؟" : "Mot de passe oublié ?"}
                        </Link>
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prefs" className="mt-4">
                  <Card className="border-0 shadow-soft ring-1 ring-border/60">
                    <CardHeader>
                      <CardTitle>{isAr ? "التفضيلات" : "Préférences"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="mb-2 block">{isAr ? "اللغة" : "Langue"}</Label>
                        <div className="flex gap-3">
                          <Button
                            variant={language === "fr" ? "default" : "outline"}
                            onClick={() => void setLangAndPersist("fr")}
                          >
                            Français
                          </Button>
                          <Button
                            variant={language === "ar" ? "default" : "outline"}
                            onClick={() => void setLangAndPersist("ar")}
                          >
                            العربية
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
                        <div>
                          <Label className="block">{isAr ? "المظهر" : "Apparence"}</Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isAr ? "فاتح أو داكن" : "Clair ou sombre — glissez le bouton"}
                          </p>
                        </div>
                        <ModeToggle />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border p-4">
                        <div>
                          <p className="font-medium text-sm">
                            {isAr ? "إشعارات البريد" : "Notifications e-mail"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isAr
                              ? "رسائل الترحيب وتأكيد الاشتراك"
                              : "E-mails de bienvenue et confirmation d'abonnement"}
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={(v) => setEmailNotifications(v)}
                        />
                      </div>
                      <Button onClick={saveProfile} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isAr ? "حفظ التفضيلات" : "Enregistrer les préférences"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="account" className="mt-4">
                  <Card className="border-0 shadow-soft ring-1 ring-border/60">
                    <CardHeader>
                      <CardTitle>{isAr ? "معلومات الحساب" : "Compte"}</CardTitle>
                      <CardDescription>
                        {isAr ? "للقراءة فقط" : "Lecture seule"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">{isAr ? "الدور" : "Rôle"}</p>
                        <p className="font-medium">{user?.role}</p>
                      </div>
                      {user?.publicId && (
                        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {isAr ? "رقم الحساب" : "N° compte"}
                            </p>
                            <p className="font-mono text-lg font-semibold tracking-wider">
                              {user.publicId}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(user.publicId)
                              toast.success(isAr ? "تم النسخ" : "Copié")
                            }}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {isAr ? "نسخ" : "Copier"}
                          </Button>
                        </div>
                      )}
                      <Link
                        href="/profile"
                        className="text-primary text-sm hover:underline inline-block mt-2"
                      >
                        {isAr ? "عرض الملف الشخصي" : "Voir mon profil"}
                      </Link>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
