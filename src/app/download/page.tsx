"use client"

import Image from "next/image"
import Link from "next/link"
import { Smartphone, Download, ShieldCheck, QrCode, Apple } from "lucide-react"
import { MarketingNavbar } from "@/components/layout/marketing-navbar"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/providers/language-provider"

const APK_HREF = "/downloads/amenallah-latest.apk"
const APP_VERSION = "1.2.0"

export default function DownloadPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"

  const steps = isAr
    ? [
        "افتح هذه الصفحة على هاتف أندرويد (أو امسح رمز QR).",
        "اضغط «تحميل التطبيق» لتحميل ملف APK.",
        "اسمح بالتثبيت من المتصفح إن طلب النظام ذلك.",
        "ثبّت Amenallah — لا حاجة لتطبيق Expo Go.",
      ]
    : [
        "Ouvrez cette page sur un téléphone Android (ou scannez le QR).",
        "Appuyez sur « Télécharger l'app » pour récupérer l'APK.",
        "Autorisez l'installation depuis le navigateur si Android le demande.",
        "Installez Amenallah — aucun Expo Go requis.",
      ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-blue-50 dark:from-slate-950 dark:via-background dark:to-slate-900" dir={isAr ? "rtl" : "ltr"}>
      <MarketingNavbar solid />

      <main className="container max-w-3xl py-12 md:py-20">
        <div className="flex flex-col items-center text-center gap-6">
          <Image
            src="/images/logo.jpeg"
            alt="Amenallah"
            width={96}
            height={96}
            className="rounded-2xl shadow-lg object-cover"
            priority
          />
          <div>
            <p className="text-sm font-medium text-primary mb-2 flex items-center justify-center gap-2">
              <Smartphone className="h-4 w-4" />
              Android · iOS
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? "تحميل تطبيق أمان الله" : "Télécharger Amenallah"}
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              {isAr
                ? "أندرويد: ملف APK موقّع من موقعنا. آيفون: نفس التطبيق عبر TestFlight / متجر Apple قريباً."
                : "Android : APK signé depuis notre site. iPhone : la même app via TestFlight / App Store bientôt."}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isAr ? "الإصدار" : "Version"} {APP_VERSION} ·{" "}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">tn.amenallah.education</code>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button asChild size="lg" className="rounded-full px-8 gap-2">
              <a href={APK_HREF} download>
                <Download className="h-5 w-5" />
                {isAr ? "تحميل لأندرويد (APK)" : "Télécharger Android (APK)"}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link href="/login">{isAr ? "الدخول عبر الويب" : "Connexion web"}</Link>
            </Button>
          </div>
        </div>

        <ol className="mt-14 space-y-4 max-w-xl mx-auto">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 text-start items-start rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/70 px-4 py-3 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-sm md:text-base text-slate-700 dark:text-slate-200 pt-1">{step}</span>
            </li>
          ))}
        </ol>

        <section
          className="mt-14 max-w-2xl mx-auto rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/70 p-6 shadow-sm text-start"
          aria-labelledby="ios-download-heading"
        >
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <Apple className="h-5 w-5 text-slate-800 dark:text-slate-200" />
            <h2 id="ios-download-heading">{isAr ? "آيفون (iOS)" : "iPhone (iOS)"}</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? "تطبيق iOS هو نفس مشروع Expo (ليس تطبيقاً منفصلاً). التثبيت يتم عبر TestFlight أو رابط تثبيت EAS الداخلي بعد بناء السحابة — لا يوجد ملف IPA للتحميل المباشر مثل APK."
              : "L'app iOS est le même projet Expo (pas une app séparée). L'installation passe par TestFlight ou un lien EAS interne après le build cloud — pas d'IPA en téléchargement direct comme l'APK."}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {isAr ? "الحالة: قريباً (TestFlight / App Store)." : "Statut : bientôt (TestFlight / App Store)."}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-4 rounded-full px-6"
            disabled
            aria-disabled
          >
            {isAr ? "TestFlight — قريباً" : "TestFlight — bientôt"}
          </Button>
        </section>

        <div className="mt-14 grid md:grid-cols-2 gap-8 items-center max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-3 rounded-2xl border dark:border-slate-700/60 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
            <QrCode className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {isAr ? "امسح للتثبيت (أندرويد)" : "Scannez pour installer (Android)"}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/android-download-qr.png"
              alt={isAr ? "رمز QR لتحميل التطبيق" : "QR code page téléchargement"}
              width={180}
              height={180}
              className="rounded-lg border bg-white"
            />
            <p className="text-xs text-muted-foreground text-center">
              {isAr
                ? "يفتح صفحة التحميل (وليس ملف APK مباشرة)."
                : "Ouvre la page de téléchargement (pas le fichier APK brut)."}
            </p>
          </div>

          <div className="rounded-2xl border dark:border-slate-700/60 bg-white dark:bg-slate-900/70 p-6 shadow-sm text-start space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              {isAr ? "أمان" : "Sécurité"}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "ثبّت فقط من موقع أمان الله أو TestFlight الرسمي. ملف أندرويد موقّع بمفتاح المشروع (EAS). لا تثبّت APK من مصادر مجهولة."
                : "N'installez que depuis le site Amenallah ou le TestFlight officiel. L'APK Android est signé avec le keystore du projet (EAS). N'installez jamais un APK d'une source inconnue."}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
