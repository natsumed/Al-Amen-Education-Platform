import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  className?: string
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {trend && (
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full",
              trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
