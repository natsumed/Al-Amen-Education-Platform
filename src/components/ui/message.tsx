import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const messageVariants = cva("flex w-full gap-2", {
  variants: {
    align: {
      start: "flex-row",
      end: "flex-row-reverse",
    },
  },
  defaultVariants: { align: "start" },
})

const Message = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof messageVariants>
>(({ className, align, ...props }, ref) => (
  <div ref={ref} className={cn(messageVariants({ align }), className)} {...props} />
))
Message.displayName = "Message"

const MessageAvatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-0.5 shrink-0", className)} {...props} />
  )
)
MessageAvatar.displayName = "MessageAvatar"

const MessageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />
  )
)
MessageContent.displayName = "MessageContent"

const MessageFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-1 text-[11px] text-muted-foreground", className)} {...props} />
  )
)
MessageFooter.displayName = "MessageFooter"

export { Message, MessageAvatar, MessageContent, MessageFooter }
