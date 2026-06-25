import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page introuvable</h2>
      <p className="text-muted-foreground mb-8">La page que vous cherchez n'existe pas.</p>
      <Link href="/" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors">
        Retour à l'accueil
      </Link>
    </div>
  )
}
