import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const markerVariants = cva("flex items-center gap-2 text-sm text-muted-foreground", {
  variants: {
    variant: {
      default: "",
      separator: "my-2 justify-center gap-3 text-xs before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border",
    },
  },
  defaultVariants: { variant: "default" },
})

const Marker = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof markerVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(markerVariants({ variant }), className)} {...props} />
))
Marker.displayName = "Marker"

const MarkerIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex size-5 shrink-0 items-center justify-center [&>svg]:size-3.5", className)} {...props} />
  )
)
MarkerIcon.displayName = "MarkerIcon"

const MarkerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("min-w-0", className)} {...props} />
  )
)
MarkerContent.displayName = "MarkerContent"

export { Marker, MarkerIcon, MarkerContent }
