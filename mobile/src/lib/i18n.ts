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
  noMedia: {
    fr: "Aucun média lié pour l'instant (Drive bientôt)",
    ar: "لا يوجد وسائط بعد (Drive قريباً)",
  },
  accountNumber: { fr: "N° compte", ar: "رقم الحساب" },
  installExpoFirst: {
    fr: "Installez Expo Go (SDK 57), même Wi‑Fi, puis scannez le QR.",
    ar: "ثبّت Expo Go (SDK 57)، نفس الشبكة، ثم امسح الرمز.",
  },
  parentNoCourses: {
    fr: "Les cours sont sur le compte élève. Ici : suivi et paiement via le web.",
    ar: "الدروس على حساب التلميذ. هنا المتابعة والدفع عبر الموقع.",
  },
  browse: { fr: "Parcourir", ar: "تصفح" },
  library: { fr: "Bibliothèque", ar: "مكتبتي" },
  loading: { fr: "Chargement…", ar: "جاري التحميل…" },
  loginFailed: { fr: "Échec de connexion", ar: "فشل تسجيل الدخول" },
}

export function t(key: keyof typeof dict, lang: Language): string {
  return dict[key][lang]
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
