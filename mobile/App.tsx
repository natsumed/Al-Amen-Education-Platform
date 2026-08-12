import React, { useCallback, useEffect, useState } from "react"
import * as SplashScreen from "expo-splash-screen"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./src/lib/auth-context"
import { ThemeProvider } from "./src/theme"
import { RootNavigator } from "./src/navigation"
import { ErrorBoundary } from "./src/components/ErrorBoundary"
import { useAppFonts } from "./src/theme/fonts"

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  const fontsLoaded = useAppFonts()
  // Never block forever if font download fails (offline / flaky network).
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (fontsLoaded) {
      setReady(true)
      return
    }
    const timer = setTimeout(() => setReady(true), 2500)
    return () => clearTimeout(timer)
  }, [fontsLoaded])

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  if (!ready) return null

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
