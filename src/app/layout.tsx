import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/providers/session-provider"
import { LanguageProvider } from "@/providers/language-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { Toaster } from "sonner"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Amenallah Edition | أمان الله للنشر و التوزيع",
  description:
    "Plateforme éducative tunisienne — Cours vidéo, livres PDF et animations pour les élèves du primaire — Amenallah Edition",
  icons: {
    icon: [{ url: "/images/logo.jpeg", type: "image/jpeg" }],
    shortcut: "/images/logo.jpeg",
    apple: [{ url: "/images/logo.jpeg", type: "image/jpeg" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="amenallah-theme">
          <SessionProvider>
            <LanguageProvider>
              {children}
              <Toaster richColors position="top-right" />
            </LanguageProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
