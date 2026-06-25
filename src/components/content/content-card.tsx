"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Play, BookOpen, Zap, Star, Film, FileText } from "lucide-react"
import { contentTypeLabel, gradeLabel, getYouTubeThumbnail } from "@/lib/utils"
import type { Content } from "@/types"

interface ContentCardProps {
  content: Content
  language?: "ar" | "fr"
  canAccess?: boolean
}

const TYPE_ICONS: Record<string, any> = {
  COURSE: Film,
  BOOK: FileText,
  SERIES: BookOpen,
  ANIMATION: Zap,
}

const TYPE_COLORS: Record<string, string> = {
  COURSE: "from-blue-500 to-blue-600",
  BOOK: "from-emerald-500 to-emerald-600",
  SERIES: "from-amber-500 to-amber-600",
  ANIMATION: "from-purple-500 to-purple-600",
}

export function ContentCard({ content, language = "fr", canAccess = false }: ContentCardProps) {
  const title = language === "ar" ? content.titleAr : content.titleFr
  const TypeIcon = TYPE_ICONS[content.contentType] || Play
  const typeColor = TYPE_COLORS[content.contentType] || "from-gray-500 to-gray-600"
  const thumbnail = content.thumbnailUrl || (content.youtubeUrl ? getYouTubeThumbnail(content.youtubeUrl) : null)

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-sm hover:-translate-y-1">
      <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 bg-gradient-to-br ${typeColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <TypeIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-3 start-3 flex gap-2">
          <Badge 
            variant={content.isFree ? "success" : "warning"} 
            className="text-xs shadow-sm backdrop-blur-sm"
          >
            {content.isFree ? (language === "ar" ? "مجاني" : "Gratuit") : (language === "ar" ? "مميز" : "Premium")}
          </Badge>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 end-3">
          <div className={`w-8 h-8 bg-gradient-to-br ${typeColor} rounded-lg flex items-center justify-center shadow-sm`}>
            <TypeIcon className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Lock overlay for premium content */}
        {!canAccess && !content.isFree && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-center">
              <Lock className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">{language === "ar" ? "محتوى مميز" : "Contenu Premium"}</p>
            </div>
          </div>
        )}

        {/* Play button overlay for videos */}
        {content.youtubeUrl && (canAccess || content.isFree) && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
              <Play className="h-6 w-6 text-primary ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">{gradeLabel(content.grade, language)}</Badge>
          <span className="text-xs text-muted-foreground">{contentTypeLabel(content.contentType, language)}</span>
        </div>
        <h3 className="font-semibold text-sm leading-tight mb-3 line-clamp-2 min-h-[2.5rem]">{title}</h3>
        <Link href={`/content/${content.id}`}>
          <Button size="sm" className="w-full" variant={canAccess || content.isFree ? "default" : "outline"}>
            {!canAccess && !content.isFree ? (
              <><Lock className="h-3 w-3 mr-1" />{language === "ar" ? "اشترك" : "S'abonner"}</>
            ) : (
              <><TypeIcon className="h-3 w-3 mr-1" />{language === "ar" ? "الدخول" : "Ouvrir"}</>
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
