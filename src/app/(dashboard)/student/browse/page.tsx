"use client"

import { useState, useEffect } from "react"
import { ContentGrid } from "@/components/content/content-grid"
import { ContentFilters } from "@/components/content/content-filters"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function StudentBrowsePage() {
  const { user } = useCurrentUser()
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)

  useEffect(() => {
    fetch("/api/subscriptions/me").then((r) => r.json()).then((d) => setHasSubscription(!!d.subscription))
  }, [])

  const fetchContent = async (filters: Record<string, string> = {}) => {
    setLoading(true)
    const q = new URLSearchParams({ ...filters, limit: "24" }).toString()
    const res = await fetch(`/api/content?${q}`)
    const data = await res.json()
    setContents(data.items || [])
    setLoading(false)
  }

  useEffect(() => { fetchContent() }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Explorer les contenus</h1>
      <ContentFilters onFiltersChange={fetchContent} />
      <ContentGrid contents={contents} loading={loading} userHasAccess={hasSubscription} />
    </div>
  )
}
