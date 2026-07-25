"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect, useState } from "react"
import { Search, X, SlidersHorizontal } from "lucide-react"

interface ContentFiltersProps {
  onFiltersChange: (filters: Record<string, string>) => void
  language?: "ar" | "fr"
}

export function ContentFilters({ onFiltersChange, language = "fr" }: ContentFiltersProps) {
  const [search, setSearch] = useState("")
  const [grade, setGrade] = useState("all")
  const [subject, setSubject] = useState("all")
  const [contentType, setContentType] = useState("all")
  const debouncedSearch = useDebounce(search, 400)

  const isAr = language === "ar"

  useEffect(() => {
    onFiltersChange({
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(grade !== "all" && { grade }),
      ...(subject !== "all" && { subject }),
      ...(contentType !== "all" && { contentType }),
    })
  }, [debouncedSearch, grade, subject, contentType])

  const resetFilters = () => {
    setSearch("")
    setGrade("all")
    setSubject("all")
    setContentType("all")
  }

  const hasActiveFilters = search || grade !== "all" || subject !== "all" || contentType !== "all"

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10 pr-10 h-11"
          placeholder={isAr ? "ابحث عن دورة، كتاب، سلسلة..." : "Rechercher un cours, livre, série..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue placeholder={isAr ? "السنة الدراسية" : "Année scolaire"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل السنوات" : "Toutes les années"}</SelectItem>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <SelectItem key={n} value={`GRADE_${n}`}>
                {isAr ? `السنة ${n} ابتدائي` : `${n}ème année`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue placeholder={isAr ? "المادة" : "Matière"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل المواد" : "Toutes les matières"}</SelectItem>
            <SelectItem value="ARABIC">{isAr ? "العربية" : "Arabe"}</SelectItem>
            <SelectItem value="FRENCH">{isAr ? "الفرنسية" : "Français"}</SelectItem>
            <SelectItem value="MATH">{isAr ? "الرياضيات" : "Mathématiques"}</SelectItem>
            <SelectItem value="SCIENCE">{isAr ? "العلوم" : "Sciences"}</SelectItem>
            <SelectItem value="ISLAMIC">{isAr ? "التربية الإسلامية" : "Éducation islamique"}</SelectItem>
            <SelectItem value="HISTORY">{isAr ? "التاريخ والجغرافيا" : "Histoire-Géo"}</SelectItem>
            <SelectItem value="CIVIC">{isAr ? "التربية المدنية" : "Éducation civique"}</SelectItem>
            <SelectItem value="ARTS">{isAr ? "الفنون" : "Arts"}</SelectItem>
            <SelectItem value="ENGLISH">{isAr ? "الإنجليزية" : "Anglais"}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue placeholder={isAr ? "نوع المحتوى" : "Type de contenu"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الأنواع" : "Tous les types"}</SelectItem>
            <SelectItem value="COURSE">{isAr ? "دروس فيديو" : "Cours vidéo"}</SelectItem>
            <SelectItem value="BOOK">{isAr ? "كتب PDF" : "Livres PDF"}</SelectItem>
            <SelectItem value="SERIES">{isAr ? "سلاسل تمارين" : "Séries d'exercices"}</SelectItem>
            <SelectItem value="ANIMATION">{isAr ? "رسوم متحركة" : "Animations"}</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
            {isAr ? "مسح الفلاتر" : "Effacer les filtres"}
          </Button>
        )}
      </div>
    </div>
  )
}
