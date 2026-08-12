import { useCallback, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import { api, type ProgressItem } from "../../lib/api"
import { useAuth } from "../../lib/auth-context"

const CACHE_KEY = "amenallah_progress_cache"

export function useProgress() {
  const { token } = useAuth()
  const [items, setItems] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const data = await api.getProgress(token)
      setItems(data.items || [])
      setOffline(false)
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.items || []))
    } catch {
      const cached = await AsyncStorage.getItem(CACHE_KEY)
      setItems(cached ? JSON.parse(cached) : [])
      setOffline(Boolean(cached))
    } finally {
      setLoading(false)
    }
  }, [token])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )

  return { items, loading, offline, reload: load }
}
