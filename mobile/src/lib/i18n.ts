export type Language = "fr" | "ar"

const dict = {
  brand: { fr: "Amenallah", ar: "أمان الله" },
  brandSub: {
    fr: "Plateforme éducative tunisienne",
    ar: "منصة التعليم التونسية",
  },
  email: { fr: "Email", ar: "البريد" },
  password: { fr: "Mot de passe", ar: "كلمة المرور" },
  login: { fr: "Se connecter", ar: "دخول" },
  logout: { fr: "Déconnexion", ar: "خروج" },
  home: { fr: "Accueil", ar: "الرئيسية" },
  catalogue: { fr: "Catalogue", ar: "التصفح" },
  profile: { fr: "Profil", ar: "الملف" },
  children: { fr: "Enfants", ar: "الأطفال" },
  continueLearning: { fr: "Continuez votre apprentissage", ar: "واصل التعلم" },
  teacherWelcome: {
    fr: "Ressources pour vos cours",
    ar: "موارد لدروسك",
  },
  parentWelcome: {
    fr: "Suivi parental — pas d'accès aux cours",
    ar: "متابعة أولياء الأمور — بدون دروس",
  },
  adminBlocked: {
    fr: "L'admin utilise le site web. Déconnectez-vous pour un autre compte.",
    ar: "المدير يستخدم الموقع. سجّل الخروج لحساب آخر.",
  },
  allGrades: { fr: "Tous", ar: "الكل" },
  grade: { fr: "Année", ar: "سنة" },
  free: { fr: "Gratuit", ar: "مجاني" },
  premium: { fr: "Premium", ar: "مميز" },
  emptyContent: {
    fr: "Aucun contenu pour le moment",
    ar: "لا يوجد محتوى حالياً",
  },
  apiDown: {
    fr: "Impossible de joindre l'API. Vérifiez que Next.js tourne sur le port 3000.",
    ar: "تعذر الاتصال بالخادم. تأكد أن Next.js يعمل على المنفذ 3000.",
  },
  openVideo: { fr: "Ouvrir la vidéo", ar: "فتح الفيديو" },
  openPdf: { fr: "Ouvrir le PDF", ar: "فتح PDF" },
  openAnim: { fr: "Ouvrir l'animation", ar: "فتح الرسوم" },
  locked: {
    fr: "Contenu premium — abonnez-vous sur le web",
    ar: "محتوى مميز — اشترك عبر الموقع",
  },
  lockedShort: { fr: "Verrouillé", ar: "مقفل" },
  noMedia: {
    fr: "Aucun média lié pour l'instant (Drive bientôt)",
    ar: "لا يوجد وسائط بعد (Drive قريباً)",
  },
  accountNumber: { fr: "N° compte", ar: "رقم الحساب" },
  downloadAppHint: {
    fr: "Application Amenallah — téléchargez l'APK depuis amenallah.tn/download",
    ar: "تطبيق أمان الله — حمّل ملف APK من الموقع /download",
  },
  parentNoCourses: {
    fr: "Les cours sont sur le compte élève. Ici : suivi et paiement via le web.",
    ar: "الدروس على حساب التلميذ. هنا المتابعة والدفع عبر الموقع.",
  },
  browse: { fr: "Parcourir", ar: "تصفح" },
  library: { fr: "Bibliothèque", ar: "مكتبتي" },
  loading: { fr: "Chargement…", ar: "جاري التحميل…" },
  loginFailed: { fr: "Échec de connexion", ar: "فشل تسجيل الدخول" },
  payOnWeb: { fr: "Payer sur le web", ar: "الدفع عبر الموقع" },
  version: { fr: "Version", ar: "الإصدار" },
  myCourses: { fr: "Mes cours", ar: "دروسي" },
  progress: { fr: "Progression", ar: "التقدم" },
  subscription: { fr: "Abonnement", ar: "الاشتراك" },
  continueCourse: { fr: "Reprendre", ar: "متابعة" },
  completed: { fr: "Terminé", ar: "مكتمل" },
  inProgress: { fr: "En cours", ar: "قيد التقدم" },
  noCourses: { fr: "Commencez un cours pour le retrouver ici", ar: "ابدأ درساً ليظهر هنا" },
  search: { fr: "Rechercher un cours", ar: "ابحث عن درس" },
  allSubjects: { fr: "Toutes les matières", ar: "كل المواد" },
  allTypes: { fr: "Tous les formats", ar: "كل الأنواع" },
  markComplete: { fr: "Marquer comme terminé", ar: "وضع علامة مكتمل" },
  subscribe: { fr: "S'abonner sur le web", ar: "اشترك عبر الموقع" },
  activePlan: { fr: "Votre abonnement", ar: "اشتراكك" },
  freePlan: { fr: "Compte gratuit", ar: "حساب مجاني" },
  daysRemaining: { fr: "jours restants", ar: "أيام متبقية" },
  settings: { fr: "Paramètres", ar: "الإعدادات" },
  fullName: { fr: "Nom complet", ar: "الاسم الكامل" },
  phone: { fr: "Téléphone", ar: "الهاتف" },
  save: { fr: "Enregistrer", ar: "حفظ" },
  saved: { fr: "Modifications enregistrées", ar: "تم حفظ التغييرات" },
  register: { fr: "Créer un compte", ar: "إنشاء حساب" },
  forgotPassword: { fr: "Mot de passe oublié ?", ar: "نسيت كلمة المرور؟" },
  backToLogin: { fr: "Retour à la connexion", ar: "العودة للدخول" },
  sendResetLink: { fr: "Envoyer le lien", ar: "إرسال الرابط" },
  resetSent: { fr: "Vérifiez votre boîte email", ar: "تحقق من بريدك الإلكتروني" },
  createAccount: { fr: "Créer mon compte", ar: "إنشاء حسابي" },
  currentPassword: { fr: "Mot de passe actuel", ar: "كلمة المرور الحالية" },
  newPassword: { fr: "Nouveau mot de passe", ar: "كلمة المرور الجديدة" },
  confirmPassword: { fr: "Confirmer le mot de passe", ar: "تأكيد كلمة المرور" },
  changePassword: { fr: "Changer le mot de passe", ar: "تغيير كلمة المرور" },
  reviews: { fr: "Avis", ar: "التقييمات" },
  sendReview: { fr: "Publier mon avis", ar: "نشر تقييمي" },
  invitations: { fr: "Invitations parent", ar: "دعوات الولي" },
  accept: { fr: "Accepter", ar: "قبول" },
  reject: { fr: "Refuser", ar: "رفض" },
  linkChild: { fr: "Lier un enfant", ar: "ربط طفل" },
  childIdentifier: { fr: "N° compte ou email de l'élève", ar: "رقم حساب أو بريد التلميذ" },
  help: { fr: "Aide", ar: "مساعدة" },
  askQuestion: { fr: "Posez votre question", ar: "اطرح سؤالك" },
  offlineData: { fr: "Données enregistrées hors connexion", ar: "بيانات محفوظة دون اتصال" },
  explore: { fr: "Explorer", ar: "استكشف" },
  greetingMorning: { fr: "Bonjour", ar: "صباح الخير" },
  greetingEvening: { fr: "Bonsoir", ar: "مساء الخير" },
  recommended: { fr: "Recommandé pour vous", ar: "موصى به لك" },
  freeForYou: { fr: "Gratuit à découvrir", ar: "مجاني لاكتشافه" },
  seeAll: { fr: "Tout voir", ar: "عرض الكل" },
  statAccessed: { fr: "Cours", ar: "دروس" },
  statCompleted: { fr: "Terminés", ar: "مكتملة" },
  statInProgress: { fr: "En cours", ar: "قيد التقدم" },
  avgProgress: { fr: "Progression moy.", ar: "متوسط التقدم" },
  bySubject: { fr: "Par matière", ar: "حسب المادة" },
  filters: { fr: "Filtres", ar: "الفلاتر" },
  clearFilters: { fr: "Réinitialiser", ar: "إعادة ضبط" },
  applyFilters: { fr: "Voir les résultats", ar: "عرض النتائج" },
  freeOnly: { fr: "Gratuit uniquement", ar: "المجاني فقط" },
  results: { fr: "résultats", ar: "نتيجة" },
  loadMore: { fr: "Charger plus", ar: "تحميل المزيد" },
  retry: { fr: "Réessayer", ar: "إعادة المحاولة" },
  share: { fr: "Partager", ar: "مشاركة" },
  openInBrowser: { fr: "Ouvrir dans le navigateur", ar: "فتح في المتصفح" },
  yourComment: { fr: "Votre commentaire", ar: "تعليقك" },
  relatedContent: { fr: "Contenus similaires", ar: "محتوى مشابه" },
  offline: { fr: "Vous êtes hors connexion", ar: "أنت غير متصل" },
  browseEmptyCta: { fr: "Parcourir le catalogue", ar: "تصفح المحتوى" },
  emptyProgressTitle: { fr: "Aucun cours commencé", ar: "لم تبدأ أي درس" },
  emptyProgressCta: { fr: "Découvrir des cours", ar: "اكتشف الدروس" },
  continueSection: { fr: "Reprendre", ar: "متابعة" },
  completedSection: { fr: "Terminés", ar: "المكتملة" },
  account: { fr: "Compte", ar: "الحساب" },
  security: { fr: "Sécurité", ar: "الأمان" },
  preferences: { fr: "Préférences", ar: "التفضيلات" },
  language: { fr: "Langue", ar: "اللغة" },
  appearance: { fr: "Apparence", ar: "المظهر" },
  appearanceHint: {
    fr: "Clair ou sombre — glissez le bouton",
    ar: "فاتح أو داكن — حرّك الزر",
  },
  changePhoto: { fr: "Changer la photo", ar: "تغيير الصورة" },
  emailNotifications: { fr: "Notifications email", ar: "إشعارات البريد" },
  pushNotifications: { fr: "Notifications push", ar: "الإشعارات الفورية" },
  enableNotifications: { fr: "Activer les notifications", ar: "تفعيل الإشعارات" },
  notificationsOn: { fr: "Notifications activées", ar: "تم تفعيل الإشعارات" },
  notificationsDenied: { fr: "Permission refusée", ar: "تم رفض الإذن" },
  send: { fr: "Envoyer", ar: "إرسال" },
  helpIntro: {
    fr: "Posez une question sur les cours, l'abonnement ou votre compte.",
    ar: "اطرح سؤالاً حول الدروس أو الاشتراك أو حسابك.",
  },
  role: { fr: "Rôle", ar: "الصفة" },
  student: { fr: "Élève", ar: "تلميذ" },
  teacher: { fr: "Enseignant", ar: "معلم" },
  parent: { fr: "Parent", ar: "ولي أمر" },
  chooseRole: { fr: "Je suis…", ar: "أنا…" },
  studentIdOptional: { fr: "N° élève (parent)", ar: "رقم التلميذ (لولي الأمر)" },
  copyId: { fr: "Copier", ar: "نسخ" },
  copied: { fr: "Copié", ar: "تم النسخ" },
  teacherHubBrowse: { fr: "Explorer les ressources", ar: "استكشف الموارد" },
  teacherHubLibrary: { fr: "Ma bibliothèque", ar: "مكتبتي" },
  teacherHubSub: { fr: "Mon abonnement", ar: "اشتراكي" },
  childProgress: { fr: "Progression de l'enfant", ar: "تقدم الطفل" },
  noChildren: { fr: "Aucun enfant lié", ar: "لا يوجد أطفال مرتبطون" },
  invitationSent: { fr: "Invitation envoyée", ar: "تم إرسال الدعوة" },
  planStudentMonthly: { fr: "Élève · mensuel", ar: "تلميذ · شهري" },
  planStudentYearly: { fr: "Élève · annuel", ar: "تلميذ · سنوي" },
  planTeacherMonthly: { fr: "Enseignant · mensuel", ar: "معلم · شهري" },
  planTeacherYearly: { fr: "Enseignant · annuel", ar: "معلم · سنوي" },
  perMonth: { fr: "/mois", ar: "/شهر" },
  perYear: { fr: "/an", ar: "/سنة" },
  managePlanWeb: { fr: "Gérer sur le web", ar: "الإدارة عبر الموقع" },
  faq: { fr: "Questions fréquentes", ar: "أسئلة شائعة" },
  faqAccess: { fr: "Comment accéder aux cours premium ?", ar: "كيف أصل إلى الدروس المميزة؟" },
  faqPay: { fr: "Comment payer mon abonnement ?", ar: "كيف أدفع اشتراكي؟" },
  faqParent: { fr: "Comment lier un compte parent ?", ar: "كيف أربط حساب ولي الأمر؟" },
}

export function t(key: keyof typeof dict, lang: Language): string {
  return dict[key][lang]
}

export function isRTL(lang: Language): boolean {
  return lang === "ar"
}

export function greeting(lang: Language): string {
  const hour = new Date().getHours()
  return hour < 18 ? t("greetingMorning", lang) : t("greetingEvening", lang)
}

export function contentTitle(
  item: { titleAr: string; titleFr: string },
  lang: Language
): string {
  return lang === "ar" ? item.titleAr : item.titleFr
}

export function contentDescription(
  item: { descriptionAr?: string | null; descriptionFr?: string | null },
  lang: Language
): string {
  return (lang === "ar" ? item.descriptionAr : item.descriptionFr) || ""
}
