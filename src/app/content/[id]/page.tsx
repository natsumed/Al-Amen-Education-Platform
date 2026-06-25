"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Download, Play, BookOpen, ArrowLeft, Star, Clock, Eye, Globe, FileText, Film, Zap, ChevronRight, Share2 } from "lucide-react"
import { contentTypeLabel, gradeLabel, getYouTubeId } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useLanguage } from "@/providers/language-provider"
import { toast } from "sonner"

const TYPE_ICONS: Record<string, any> = {
  COURSE: Film,
  BOOK: FileText,
  SERIES: BookOpen,
  ANIMATION: Zap,
}

export default function ContentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useCurrentUser()
  const { language, setLanguage } = useLanguage()
  const isAr = language === "ar"
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [relatedContent, setRelatedContent] = useState<any[]>([])
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    fetch(`/api/content/${id}`)
      .then(r => r.json())
      .then(d => {
        setContent(d)
        setLoading(false)
        if (d.id) {
          fetch(`/api/reviews?contentId=${d.id}`).then(r => r.json()).then(data => setReviews(data.reviews || []))
          fetch(`/api/content?grade=${d.grade}&subject=${d.subject}&limit=4`).then(r => r.json()).then(data => {
            setRelatedContent((data.items || []).filter((c: any) => c.id !== d.id).slice(0, 3))
          })
        }
      })
  }, [id])

  const submitReview = async () => {
    if (!user) { toast.error(isAr ? "يجب تسجيل الدخول" : "Veuillez vous connecter"); return }
    if (newReview.rating === 0) { toast.error(isAr ? "اختر تقييماً" : "Veuillez choisir une note"); return }
    setSubmittingReview(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: id, rating: newReview.rating, comment: newReview.comment }),
      })
      if (!res.ok) throw new Error()
      toast.success(isAr ? "تم إضافة تقييمك!" : "Votre avis a été ajouté!")
      setNewReview({ rating: 0, comment: "" })
      fetch(`/api/reviews?contentId=${id}`).then(r => r.json()).then(data => setReviews(data.reviews || []))
    } catch {
      toast.error(isAr ? "خطأ في إرسال التقييم" : "Erreur lors de l'envoi")
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">{isAr ? "جاري التحميل..." : "Chargement..."}</p>
      </div>
    </div>
  )

  if (!content) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{isAr ? "المحتوى غير موجود" : "Contenu introuvable"}</h2>
        <p className="text-muted-foreground mb-4">{isAr ? "هذا المحتوى غير متاح أو تم حذفه" : "Ce contenu n'est pas disponible ou a été supprimé"}</p>
        <Link href="/content/browse"><Button>{isAr ? "العودة للتصفح" : "Retour au catalogue"}</Button></Link>
      </div>
    </div>
  )

  const title = isAr ? content.titleAr : content.titleFr
  const description = isAr ? content.descriptionAr : content.descriptionFr
  const ytId = content.youtubeUrl ? getYouTubeId(content.youtubeUrl) : null
  const canAccess = content.access?.canAccess
  const canDownload = content.access?.canDownload
  const TypeIcon = TYPE_ICONS[content.contentType] || Film
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isAr ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/content/browse">
              <Button variant="ghost" size="icon">
                {isAr ? <ChevronRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </Button>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {isAr ? "أ" : "A"}
              </div>
              <span className="font-bold text-lg hidden sm:inline">{isAr ? "الأمان" : "Al-Amân"}</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLanguage(isAr ? "fr" : "ar")} className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              {isAr ? "FR" : "عربي"}
            </Button>
            {user ? (
              <Link href={`/${user.role.toLowerCase()}`}><Button size="sm">{isAr ? "مساحتي" : "Mon espace"}</Button></Link>
            ) : (
              <Link href="/login"><Button variant="outline" size="sm">{isAr ? "دخول" : "Connexion"}</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <main className="container py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/content/browse" className="hover:text-foreground transition-colors">{isAr ? "التصفح" : "Catalogue"}</Link>
          <ChevronRight className={`h-3 w-3 ${isAr ? "rotate-180" : ""}`} />
          <span>{gradeLabel(content.grade, language)}</span>
          <ChevronRight className={`h-3 w-3 ${isAr ? "rotate-180" : ""}`} />
          <span className="text-foreground font-medium truncate">{title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="gap-1"><TypeIcon className="h-3 w-3" />{contentTypeLabel(content.contentType, language)}</Badge>
              <Badge variant="outline">{gradeLabel(content.grade, language)}</Badge>
              <Badge variant={content.isFree ? "success" : "warning"}>
                {content.isFree ? (isAr ? "مجاني" : "Gratuit") : (isAr ? "مميز" : "Premium")}
              </Badge>
              {avgRating && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {avgRating}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{reviews.length} {isAr ? "تقييم" : "avis"}</span>
              </div>
              {content.uploadedBy && (
                <div className="flex items-center gap-1">
                  <span>{isAr ? "بواسطة" : "Par"} {content.uploadedBy.fullName}</span>
                </div>
              )}
            </div>

            {description && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            )}

            {/* Video Player */}
            {ytId && (canAccess || content.isFree ? (
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </Card>
            ) : (
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50">
                  {ytId && (
                    <img
                      src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6 bg-black/40 backdrop-blur-sm rounded-2xl">
                      <Lock className="h-12 w-12 text-white mx-auto mb-3" />
                      <p className="text-white font-semibold text-lg mb-4">
                        {isAr ? "اشترك للوصول إلى هذا المحتوى" : "Abonnez-vous pour accéder à ce contenu"}
                      </p>
                      <Link href="/pricing">
                        <Button size="lg" className="shadow-lg">
                          {isAr ? "اشترك الآن" : "S'abonner maintenant"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* PDF Section */}
            {content.pdfUrl && (canAccess || content.isFree) && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{isAr ? "ملف PDF" : "Document PDF"}</p>
                        <p className="text-sm text-muted-foreground">{isAr ? "متاح للقراءة والتحميل" : "Disponible pour lecture et téléchargement"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={content.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          {isAr ? "عرض" : "Voir"}
                        </Button>
                      </a>
                      {canDownload && (
                        <a href={content.pdfUrl} download>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            {isAr ? "تحميل" : "Télécharger"}
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GIF/Animation Section */}
            {content.gifUrl && (canAccess || content.isFree) && (
              <Card className="overflow-hidden border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Zap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{isAr ? "رسوم متحركة" : "Animation"}</p>
                        <p className="text-sm text-muted-foreground">{isAr ? "انقر للتحميل" : "Cliquez pour télécharger"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 flex items-center justify-center">
                    <img src={content.gifUrl} alt={title} className="max-w-full max-h-96 rounded-lg shadow-sm" />
                  </div>
                  {canDownload && (
                    <div className="p-4 border-t">
                      <a href={content.gifUrl} download>
                        <Button size="sm" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          {isAr ? "تحميل الرسوم المتحركة" : "Télécharger l'animation"}
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Premium Paywall */}
            {!canAccess && !content.isFree && !ytId && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{isAr ? "محتوى مميز" : "Contenu Premium"}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {isAr
                      ? "اشترك للوصول إلى جميع المحتويات المميزة والتحميل غير المحدود"
                      : "Abonnez-vous pour accéder à tous les contenus premium et au téléchargement illimité"}
                  </p>
                  <Link href="/pricing">
                    <Button size="lg" className="shadow-lg shadow-primary/25">
                      {isAr ? "اشترك الآن" : "Voir les abonnements"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  {isAr ? "التقييمات والمراجعات" : "Avis et évaluations"}
                  {reviews.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{reviews.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Review */}
                {user && (
                  <div className="border-b pb-6">
                    <p className="font-medium mb-3">{isAr ? "أضف تقييمك" : "Ajouter votre avis"}</p>
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star className={`h-6 w-6 ${(hoverRating || newReview.rating) >= star ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder={isAr ? "اكتب تعليقك هنا (اختياري)..." : "Écrivez votre commentaire ici (optionnel)..."}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="mb-3"
                      rows={3}
                    />
                    <Button onClick={submitReview} disabled={submittingReview || newReview.rating === 0} size="sm">
                      {submittingReview ? (isAr ? "جاري الإرسال..." : "Envoi...") : (isAr ? "إرسال التقييم" : "Envoyer l'avis")}
                    </Button>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    {isAr ? "لا توجد تقييمات بعد. كن أول من يقيّم!" : "Aucun avis pour le moment. Soyez le premier à évaluer!"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="flex gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {(review.user?.fullName || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{review.user?.fullName || "Utilisateur"}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20"}`} />
                              ))}
                            </div>
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(review.createdAt).toLocaleDateString(isAr ? "ar-TN" : "fr-TN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <Card className="border-0 shadow-sm sticky top-20">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "النوع" : "Type"}</span>
                    <span className="font-medium">{contentTypeLabel(content.contentType, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "السنة" : "Année"}</span>
                    <span className="font-medium">{gradeLabel(content.grade, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "الحالة" : "Statut"}</span>
                    <Badge variant={content.isFree ? "success" : "warning"} className="text-xs">
                      {content.isFree ? (isAr ? "مجاني" : "Gratuit") : (isAr ? "مميز" : "Premium")}
                    </Badge>
                  </div>
                  {!content.isFree && content.price && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{isAr ? "السعر" : "Prix"}</span>
                      <span className="font-bold text-lg text-primary">{content.price} TND</span>
                    </div>
                  )}
                </div>

                {!canAccess && !content.isFree && (
                  <Link href="/pricing" className="block">
                    <Button className="w-full" size="lg">
                      {isAr ? "اشترك الآن" : "S'abonner"}
                    </Button>
                  </Link>
                )}

                {canAccess && content.isFree && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    <Eye className="h-4 w-4" />
                    <span>{isAr ? "لديك وصول كامل" : "Accès complet"}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Content */}
            {relatedContent.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{isAr ? "محتويات مشابهة" : "Contenus similaires"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedContent.map((item: any) => {
                    const itemTitle = isAr ? item.titleAr : item.titleFr
                    const ItemIcon = TYPE_ICONS[item.contentType] || Film
                    return (
                      <Link key={item.id} href={`/content/${item.id}`} className="block">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <ItemIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{itemTitle}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{gradeLabel(item.grade, language)}</Badge>
                              <Badge variant={item.isFree ? "success" : "warning"} className="text-[10px] px-1.5 py-0">
                                {item.isFree ? (isAr ? "مجاني" : "Gratuit") : (isAr ? "مميز" : "Premium")}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 {isAr ? "دارالأمان للنشر" : "Éditions Al-Amân"}. {isAr ? "جميع الحقوق محفوظة." : "Tous droits réservés."}</p>
        </div>
      </footer>
    </div>
  )
}
