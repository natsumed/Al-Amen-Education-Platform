import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
