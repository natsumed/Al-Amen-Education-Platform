"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"
import { PRICING_PLANS } from "@/types"
import { useLanguage } from "@/providers/language-provider"

export default function ParentPayPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [links, setLinks] = useState<any[]>([])
  const [childId, setChildId] = useState("")
  const [plan, setPlan] = useState("STUDENT_MONTHLY")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/parents/children")
      .then((r) => r.json())
      .then((d) => {
        const accepted = (d.links || []).filter((l: any) => l.status === "ACCEPTED")
        setLinks(accepted)
        if (accepted[0]?.student?.id) setChildId(accepted[0].student.id)
      })
  }, [])

  const studentPlans = PRICING_PLANS.filter((p) => p.role === "STUDENT")
  const selected = studentPlans.find((p) => p.id === plan)

  const submit = async () => {
    if (!childId) {
      toast.error(isAr ? "اختر تلميذاً" : "Choisissez un élève")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: "SUBSCRIPTION",
          plan,
          provider: "MANUAL",
          beneficiaryId: childId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      toast.success(
        isAr
          ? "تم إرسال الطلب — ينتظر موافقة الإدارة"
          : "Demande envoyée — en attente d'approbation admin"
      )
      router.push("/parent")
    } catch (e: any) {
      toast.error(e.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "الدفع لابن" : "Payer pour un enfant"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? "أنت لا تصل إلى الدروس — تدفع ليفتح حساب التلميذ المحتوى"
            : "Vous n'accédez pas aux cours — vous payez pour ouvrir l'accès sur le compte de l'élève"}
        </p>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {isAr ? "طلب اشتراك" : "Demande d'abonnement"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "بعد الدفع نقداً، يؤكد المدير الطلب"
              : "Après paiement en espèces, l'admin valide la demande"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isAr
                ? "لا يوجد طفل مرتبط ومقبول بعد"
                : "Aucun enfant lié et accepté pour le moment"}
            </p>
          ) : (
            <>
              <div>
                <Label>{isAr ? "التلميذ" : "Élève"}</Label>
                <Select value={childId} onValueChange={setChildId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {links.map((l) => (
                      <SelectItem key={l.student.id} value={l.student.id}>
                        {l.student.fullName} ({l.student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "الخطة" : "Plan"}</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {studentPlans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.id.replace(/_/g, " ")} — {p.price} TND / {p.period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selected && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <p className="text-2xl font-bold text-primary">{selected.price} TND</p>
                  <p className="text-sm text-muted-foreground">{selected.period}</p>
                </div>
              )}
              <Button className="w-full h-11" onClick={submit} disabled={loading || !childId}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isAr ? "إرسال الطلب" : "Envoyer la demande"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
