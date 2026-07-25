"use client"

import { useEffect, useMemo, useState } from "react"
import { MessageCircle, Send, X, Sparkles } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from "ai"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Spinner } from "@/components/ui/spinner"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const TOOL_LABELS_FR: Record<string, string> = {
  searchContent: "Recherche de contenus…",
  explainContent: "Analyse d'un contenu…",
  getPricingPlans: "Consultation des tarifs…",
  getMySubscription: "Lecture de l'abonnement…",
  getMyProgress: "Lecture de la progression…",
  getMyChildren: "Lecture des enfants liés…",
  getChildProgress: "Progression de l'enfant…",
  getPlatformHelp: "Aide plateforme…",
}

const TOOL_LABELS_AR: Record<string, string> = {
  searchContent: "البحث في المحتويات…",
  explainContent: "تحليل محتوى…",
  getPricingPlans: "قراءة الأسعار…",
  getMySubscription: "قراءة الاشتراك…",
  getMyProgress: "قراءة التقدّم…",
  getMyChildren: "قراءة الأبناء المرتبطين…",
  getChildProgress: "تقدّم الابن…",
  getPlatformHelp: "مساعدة المنصة…",
}

function messageText(message: UIMessage): string {
  return (message.parts || [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function activeToolLabels(message: UIMessage, isAr: boolean): string[] {
  const labels = isAr ? TOOL_LABELS_AR : TOOL_LABELS_FR
  const out: string[] = []
  for (const part of message.parts || []) {
    if (!isToolUIPart(part)) continue
    try {
      const key = getToolName(part)
      const label = labels[key]
      if (label && !out.includes(label)) out.push(label)
    } catch {
      /* ignore non-static tool parts */
    }
  }
  return out
}

export function HelpChatbot() {
  const { user } = useCurrentUser()
  const { language } = useLanguage()
  const isAr = language === "ar"
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [chatModeLabel, setChatModeLabel] = useState<string | null>(null)

  const role = user?.role
  const allowed = role === "STUDENT" || role === "TEACHER" || role === "PARENT"

  useEffect(() => {
    if (!allowed || !open) return
    fetch("/api/chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.label) setChatModeLabel(d.label)
      })
      .catch(() => {})
  }, [allowed, open])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { lang: isAr ? "ar" : "fr" },
      }),
    [isAr]
  )

  const welcome: UIMessage = useMemo(
    () => ({
      id: "welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: isAr
            ? "مرحباً! أنا وكيل أمان الله. يمكنني البحث في المحتوى، شرح الأسعار، ومتابعة اشتراكك أو أبنائك."
            : "Bonjour ! Je suis l'agent Amenallah. Je peux chercher du contenu, expliquer les tarifs, et consulter votre abonnement ou vos enfants.",
        },
      ],
    }),
    [isAr]
  )

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: [welcome],
    onError: (err) => {
      toast.error(err.message || (isAr ? "خطأ في المساعد" : "Erreur assistant"))
    },
  })

  const busy = status === "submitted" || status === "streaming"

  const suggestions = useMemo(() => {
    if (isAr) {
      const base = [
        { label: "الأسعار", text: "ما هي أسعار الاشتراك؟" },
        { label: "دروس عربية", text: "ما هي الدروس العربية المفيدة؟" },
      ]
      if (role === "PARENT") {
        return [
          ...base,
          { label: "تقدم ابني", text: "ما هي الدروس التي درسها ابني؟" },
        ]
      }
      return [
        ...base,
        { label: "اشتراكي", text: "هل اشتراكي نشط ومتى ينتهي؟" },
      ]
    }
    const base = [
      { label: "Tarifs", text: "Quels sont les tarifs d'abonnement ?" },
      { label: "Cours d'arabe", text: "Quels sont les cours arabes utiles ?" },
    ]
    if (role === "PARENT") {
      return [
        ...base,
        {
          label: "Progression enfant",
          text: "Quels sont les cours que mon enfant a étudiés ?",
        },
      ]
    }
    return [
      ...base,
      { label: "Mon abonnement", text: "Mon abonnement est-il actif et jusqu'à quand ?" },
    ]
  }, [isAr, role])

  if (!allowed) return null

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setInput("")
    await sendMessage({ text: trimmed })
  }

  const panel = (
    <div className="flex h-[min(70vh,560px)] flex-col">
      <MessageScrollerProvider>
        <MessageScroller className="flex-1 min-h-0">
          <MessageScrollerViewport className="px-4 py-3">
            <MessageScrollerContent>
              {messages.map((m) => {
                const text = messageText(m)
                const tools = activeToolLabels(m, isAr)
                return (
                  <div key={m.id} className="space-y-2">
                    {tools.map((label) => (
                      <Marker key={`${m.id}-${label}`} role="status">
                        <MarkerIcon>
                          <Sparkles className="size-3.5" />
                        </MarkerIcon>
                        <MarkerContent className="text-xs">{label}</MarkerContent>
                      </Marker>
                    ))}
                    {(text || m.role === "user") && (
                      <Message align={m.role === "user" ? "end" : "start"}>
                        <MessageAvatar>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={cn(
                                "text-[10px]",
                                m.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              {m.role === "user" ? "MOI" : "AI"}
                            </AvatarFallback>
                          </Avatar>
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble variant={m.role === "user" ? "default" : "muted"}>
                            <BubbleContent>{text || "…"}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                )
              })}
              {busy && (
                <Marker role="status">
                  <MarkerIcon>
                    <Spinner />
                  </MarkerIcon>
                  <MarkerContent className="shimmer">
                    {isAr ? "جارٍ التفكير…" : "Réflexion…"}
                  </MarkerContent>
                </Marker>
              )}
              {error && (
                <p className="text-xs text-destructive px-1">
                  {error.message}
                </p>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        {suggestions.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={busy}
            onClick={() => void send(s.text)}
            className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => setMessages([welcome])}
          className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent ms-auto"
        >
          {isAr ? "إعادة" : "Reset"}
        </button>
      </div>

      <form
        className="border-t p-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isAr ? "اكتب سؤالك…" : "Votre question…"}
          className="flex-1 h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={busy}
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-5 end-5 z-40 h-12 w-12 rounded-full shadow-lg"
            aria-label={isAr ? "المساعد" : "Assistant"}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{isAr ? "وكيل أمان الله" : "Agent Amenallah"}</DrawerTitle>
            <DrawerDescription>
              {chatModeLabel ||
                (isAr
                  ? "بحث في المحتوى والأسعار والاشتراك"
                  : "Recherche contenu, tarifs et abonnement")}
            </DrawerDescription>
          </DrawerHeader>
          {panel}
          <div className="p-2 flex justify-center">
            <DrawerClose asChild>
              <Button variant="outline" size="sm">
                <X className="h-4 w-4 mr-1" />
                {isAr ? "إغلاق" : "Fermer"}
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 end-6 z-40 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label={isAr ? "المساعد" : "Assistant"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
      {open && (
        <div className="fixed bottom-24 end-6 z-40 w-[400px] rounded-2xl border bg-background shadow-soft overflow-hidden">
          <div className="border-b px-4 py-3">
            <p className="font-semibold text-sm">
              {isAr ? "وكيل أمان الله" : "Agent Amenallah"}
            </p>
            <p className="text-xs text-muted-foreground">
              {chatModeLabel ||
                (isAr ? "أدوات بحث + إجابات من الكتالوج" : "Outils + réponses catalogue")}
            </p>
          </div>
          {panel}
        </div>
      )}
    </>
  )
}
