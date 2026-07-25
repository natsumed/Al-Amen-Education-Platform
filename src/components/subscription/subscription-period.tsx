"use client"

import { formatDate, getDaysLeft, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Props = {
  startDate: Date | string
  endDate: Date | string
  className?: string
  showDaysLeft?: boolean
  locale?: string
}

export function SubscriptionPeriod({
  startDate,
  endDate,
  className,
  showDaysLeft = true,
  locale = "fr-TN",
}: Props) {
  const days = getDaysLeft(endDate)
  return (
    <div className={cn("space-y-1 text-sm", className)}>
      <p>
        <span className="text-muted-foreground">Début · </span>
        <span className="font-medium">{formatDate(startDate, locale)}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Fin · </span>
        <span className="font-medium">{formatDate(endDate, locale)}</span>
      </p>
      {showDaysLeft && (
        <Badge variant={days > 7 ? "success" : days > 0 ? "warning" : "destructive"} className="mt-1">
          {days > 0 ? `${days} j restants` : "Expiré"}
        </Badge>
      )}
    </div>
  )
}
