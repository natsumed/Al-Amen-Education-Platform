import { useEffect, useState } from "react"
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from "@expo-google-fonts/cairo"

/**
 * Cairo is a modern humanist sans that renders both Latin and Arabic cleanly,
 * so the whole bilingual UI shares one expressive family (no default system look).
 *
 * If Metro cannot serve font assets (ExpoAsset.downloadAsync), fall back quickly
 * so login / home are never blocked by a redbox.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  })
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (loaded || error) return
    const timer = setTimeout(() => setTimedOut(true), 2000)
    return () => clearTimeout(timer)
  }, [loaded, error])

  return loaded || Boolean(error) || timedOut
}
