import { useEffect, useState } from "react"

/**
 * Reactive connectivity flag. Starts optimistic (online) and never crashes
 * if @react-native-community/netinfo is missing from an older native binary.
 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    ;(async () => {
      try {
        const NetInfo = await import("@react-native-community/netinfo")
        if (cancelled) return
        unsubscribe = NetInfo.default.addEventListener((state) => {
          setOnline(Boolean(state.isConnected))
        })
      } catch {
        /* keep optimistic online */
      }
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return online
}
