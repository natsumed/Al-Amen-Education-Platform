"use client"

import { ContentCard } from "./content-card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileX } from "lucide-react"
import type { Content } from "@/types"

interface ContentGridProps {
  contents: Content[]
  loading?: boolean
  language?: "ar" | "fr"
  userHasAccess?: boolean
}

export function ContentGrid({ contents, loading = false, language = "fr", userHasAccess = false }: ContentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="px-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!contents.length) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {language === "ar" ? "لا يوجد محتوى" : "Aucun contenu trouvé"}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {language === "ar"
            ? "جرب تغيير الفلاتر أو البحث بكلمات مختلفة"
            : "Essayez de modifier les filtres ou de rechercher avec d'autres termes"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contents.map((c) => (
        <ContentCard key={c.id} content={c} language={language} canAccess={userHasAccess || c.isFree} />
      ))}
    </div>
  )
}
