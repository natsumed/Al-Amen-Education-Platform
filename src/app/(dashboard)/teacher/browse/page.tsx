"use client"
import { useState, useEffect } from "react"
import { ContentGrid } from "@/components/content/content-grid"
import { ContentFilters } from "@/components/content/content-filters"
export default function TeacherBrowsePage() {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchContent = async (filters: Record<string,string> = {}) => {
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
      <h1 className="text-2xl font-bold">Explorer les ressources</h1>
      <ContentFilters onFiltersChange={fetchContent} />
      <ContentGrid contents={contents} loading={loading} userHasAccess={true} />
    </div>
  )
}
