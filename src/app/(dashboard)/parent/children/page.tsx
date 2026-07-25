"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { useLanguage } from "@/providers/language-provider"

export default function ParentChildrenPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [links, setLinks] = useState<any[]>([])
  const [identifier, setIdentifier] = useState("")
  const [loading, setLoading] = useState(false)

  const load = () => {
    fetch("/api/parents/children").then((r) => r.json()).then((d) => setLinks(d.links || []))
  }

  useEffect(() => {
    load()
  }, [])

  const addChild = async () => {
    if (!identifier.trim()) return
    setLoading(true)
    const res = await fetch("/api/parents/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childIdentifier: identifier.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success(isAr ? "تم إرسال الدعوة!" : "Invitation envoyée — en attente d'acceptation")
      setIdentifier("")
      load()
    } else {
      toast.error(data.error || (isAr ? "خطأ" : "Erreur"))
    }
    setLoading(false)
  }

  const statusLabel = (status: string) => {
    if (status === "ACCEPTED") return isAr ? "مقبول" : "Accepté"
    if (status === "REJECTED") return isAr ? "مرفوض" : "Refusé"
    return isAr ? "قيد الانتظار" : "En attente"
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAr ? "أطفالي" : "Mes enfants"}</h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "ادعُ بالبريد أو رقم الحساب (8 أرقام) — يجب أن يقبل التلميذ من حسابه"
            : "Invitez par email ou n° compte (8 chiffres) — l'élève doit accepter depuis son compte"}
        </p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold">{isAr ? "إضافة طفل" : "Ajouter un enfant"}</h3>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Input
              placeholder={isAr ? "بريد أو رقم الحساب" : "Email ou n° compte élève"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <Button onClick={addChild} disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isAr ? "دعوة" : "Inviter"}
            </Button>
          </div>
        </CardContent>
      </Card>
      {links.length > 0 && (
        <div className="space-y-3">
          {links.map((l: any) => (
            <Card key={l.id}>
              <CardContent className="p-4 flex justify-between items-center gap-3">
                <div>
                  <p className="font-medium">{l.student?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{l.student?.email}</p>
                  {l.status === "ACCEPTED" && (
                    <a href={`/parent/child/${l.student?.id}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                      {isAr ? "عرض التقدم" : "Voir la progression"}
                    </a>
                  )}
                </div>
                <Badge
                  variant={
                    l.status === "ACCEPTED" ? "success" : l.status === "REJECTED" ? "destructive" : "warning"
                  }
                >
                  {statusLabel(l.status)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
