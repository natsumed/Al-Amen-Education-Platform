import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/providers/session-provider"
import { LanguageProvider } from "@/providers/language-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { Toaster } from "sonner"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Al-Amân — Éditions Al-Amân | دارالأمان للنشر",
  description: "Plateforme éducative tunisienne — Cours vidéo, livres PDF et animations pour les élèves du primaire",
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
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
