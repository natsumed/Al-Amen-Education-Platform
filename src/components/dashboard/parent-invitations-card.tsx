"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Check, X, Users } from "lucide-react"
import { useLanguage } from "@/providers/language-provider"

export function ParentInvitationsCard() {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [invitations, setInvitations] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    fetch("/api/parents/respond")
      .then((r) => r.json())
      .then((d) => setInvitations(d.invitations || []))
  }

  useEffect(() => {
    load()
  }, [])

  const respond = async (linkId: string, action: "ACCEPT" | "REJECT") => {
    setBusyId(linkId)
    const res = await fetch("/api/parents/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, action }),
    })
    if (res.ok) {
      toast.success(action === "ACCEPT" ? (isAr ? "تم القبول" : "Lien accepté") : (isAr ? "تم الرفض" : "Lien refusé"))
      load()
    } else {
      toast.error(isAr ? "خطأ" : "Erreur")
    }
    setBusyId(null)
  }

  if (invitations.length === 0) return null

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          {isAr ? "دعوات أولياء الأمور" : "Invitations parentales"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-background rounded-lg border">
            <div>
              <p className="font-medium">{inv.parent?.fullName}</p>
              <p className="text-sm text-muted-foreground">{inv.parent?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === inv.id}
                onClick={() => respond(inv.id, "ACCEPT")}
              >
                <Check className="h-4 w-4 mr-1" />
                {isAr ? "قبول" : "Accepter"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === inv.id}
                onClick={() => respond(inv.id, "REJECT")}
              >
                <X className="h-4 w-4 mr-1" />
                {isAr ? "رفض" : "Refuser"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
