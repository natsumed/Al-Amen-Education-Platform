import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const bubbleVariants = cva("relative max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      muted: "bg-muted text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
})

const Bubble = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bubbleVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(bubbleVariants({ variant }), className)} {...props} />
))
Bubble.displayName = "Bubble"

const BubbleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("whitespace-pre-wrap break-words", className)} {...props} />
  )
)
BubbleContent.displayName = "BubbleContent"

const BubbleGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props} />
  )
)
BubbleGroup.displayName = "BubbleGroup"

const BubbleReactions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-1 flex gap-1 text-xs", className)} {...props} />
  )
)
BubbleReactions.displayName = "BubbleReactions"

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions }
