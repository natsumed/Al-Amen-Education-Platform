"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type MessageScrollerContextValue = {
  viewportRef: React.RefObject<HTMLDivElement>
  atBottom: boolean
  scrollToBottom: () => void
}

const MessageScrollerContext = React.createContext<MessageScrollerContextValue | null>(null)

function useMessageScroller() {
  const ctx = React.useContext(MessageScrollerContext)
  if (!ctx) throw new Error("useMessageScroller must be used within MessageScrollerProvider")
  return ctx
}

function MessageScrollerProvider({ children }: { children: React.ReactNode }) {
  const viewportRef = React.useRef<HTMLDivElement>(null!)
  const [atBottom, setAtBottom] = React.useState(true)

  const scrollToBottom = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    setAtBottom(true)
  }, [])

  const value = React.useMemo(
    () => ({ viewportRef, atBottom, scrollToBottom }),
    [atBottom, scrollToBottom]
  )

  return (
    <MessageScrollerContext.Provider value={value}>{children}</MessageScrollerContext.Provider>
  )
}

function MessageScroller({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)} {...props}>
      {children}
    </div>
  )
}

function MessageScrollerViewport({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { viewportRef, scrollToBottom } = useMessageScroller()
  const [showButton, setShowButton] = React.useState(false)

  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowButton(distance > 64)
    }
    el.addEventListener("scroll", onScroll)
    return () => el.removeEventListener("scroll", onScroll)
  }, [viewportRef])

  React.useEffect(() => {
    scrollToBottom()
  }, [children, scrollToBottom])

  return (
    <div
      ref={viewportRef}
      className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      data-show-jump={showButton || undefined}
      {...props}
    >
      {children}
    </div>
  )
}

function MessageScrollerContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="log"
      aria-relevant="additions"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function MessageScrollerButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { scrollToBottom, viewportRef } = useMessageScroller()
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      setVisible(distance > 64)
    }
    el.addEventListener("scroll", onScroll)
    onScroll()
    return () => el.removeEventListener("scroll", onScroll)
  }, [viewportRef])

  if (!visible) return null

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={cn(
        "absolute bottom-3 left-1/2 z-10 h-8 w-8 -translate-x-1/2 rounded-full shadow-md",
        className
      )}
      onClick={scrollToBottom}
      aria-label="Scroll to latest messages"
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  )
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerButton,
  useMessageScroller,
}
