"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useCurrentUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
