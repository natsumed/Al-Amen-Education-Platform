"use client"
import { useState, useEffect } from "react"
import { useCurrentUser } from "./use-current-user"
export function useContentAccess(contentId: string) {
  const { user } = useCurrentUser()
  const [access, setAccess] = useState({ canAccess: false, canDownload: false, isSubscribed: false })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!contentId) return
    fetch(`/api/content/${contentId}/access`)
      .then((r) => r.json())
      .then((data) => { setAccess(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [contentId, user?.id])
  return { ...access, loading }
}
