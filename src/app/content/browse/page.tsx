"use client"

import { useState, useEffect, useCallback } from "react"
import { ContentGrid } from "@/components/content/content-grid"
import { ContentFilters } from "@/components/content/content-filters"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { Globe, ChevronLeft, ChevronRight, Search, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function BrowsePage() {
  const { user } = useCurrentUser()
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (user?.id) {
      fetch("/api/subscriptions/me").then(r => r.json()).then(d => setHasAccess(!!d.subscription))
    }
  }, [user])

  const fetchContent = useCallback(async (newFilters: Record<string, string> = {}, newPage = 1) => {
    setLoading(true)
    const q = new URLSearchParams({ ...newFilters, limit: "12", page: String(newPage) }).toString()
    const res = await fetch(`/api/content?${q}`)
    const data = await res.json()
    setContents(data.items || [])
    setTotalPages(data.totalPages || 1)
    setTotal(data.total || 0)
    setPage(newPage)
    setLoading(false)
  }, [])

  const handleFiltersChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
    fetchContent(newFilters, 1)
  }

  useEffect(() => { fetchContent() }, [])

  const activeFilterCount = Object.keys(filters).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isAr ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/images/logo.jpeg" alt="Amenallah Edition" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">{isAr ? "أمان الله" : "Amenallah"}</span>
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLanguage(isAr ? "fr" : "ar")} className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {isAr ? "FR" : "عربي"}
            </Button>
            {user
              ? <Link href={`/${user.role.toLowerCase()}`}><Button size="sm">{isAr ? "مساحتي" : "Mon espace"}</Button></Link>
              : <>
                  <Link href="/login"><Button variant="outline" size="sm">{isAr ? "دخول" : "Connexion"}</Button></Link>
                  <Link href="/register"><Button size="sm">{isAr ? "تسجيل" : "Inscription"}</Button></Link>
                </>
            }
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
            {isAr ? "تصفح المحتويات" : "Explorer les contenus"}
          </h1>
          <p className="text-muted-foreground">
            {isAr
              ? "اكتشف دورات الفيديو والكتب وسلاسل التمارين لجميع السنوات الدراسية"
              : "Découvrez nos cours vidéo, livres et séries d'exercices pour toutes les années scolaires"}
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {isAr ? "تصفية" : "Filtrer"}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => handleFiltersChange({})} className="gap-1 text-muted-foreground">
                  <X className="h-3 w-3" />
                  {isAr ? "مسح" : "Effacer"}
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {total} {isAr ? "نتيجة" : "résultat(s)"}
            </div>
          </div>

          {showFilters && (
            <div className="bg-card border rounded-xl p-4 mb-6 shadow-sm">
              <ContentFilters onFiltersChange={handleFiltersChange} language={language} />
            </div>
          )}
        </div>

        {/* Content Grid */}
        <ContentGrid contents={contents} loading={loading} language={language} userHasAccess={hasAccess || user?.role === "ADMIN"} />

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchContent(filters, page - 1)}
              disabled={page <= 1}
            >
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {isAr ? "السابق" : "Précédent"}
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2
                if (pageNum > totalPages || pageNum < 1) return null
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => fetchContent(filters, pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchContent(filters, page + 1)}
              disabled={page >= totalPages}
            >
              {isAr ? "التالي" : "Suivant"}
              {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 {isAr ? "أمان الله للنشر و التوزيع" : "Amenallah Edition"}. {isAr ? "جميع الحقوق محفوظة." : "Tous droits réservés."}</p>
        </div>
      </footer>
    </div>
  )
}
