import React, { useEffect, useState } from "react"
import * as SplashScreen from "expo-splash-screen"
import * as ScreenCapture from "expo-screen-capture"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./src/lib/auth-context"
import { ThemeProvider } from "./src/theme"
import { RootNavigator } from "./src/navigation"
import { ErrorBoundary } from "./src/components/ErrorBoundary"
import { useAppFonts } from "./src/theme/fonts"

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  // Global privacy baseline: protected windows stay non-capturable even
  // before navigation reaches a lesson screen.
  ScreenCapture.usePreventScreenCapture("amenallah-global")
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

  // Hide splash as soon as JS is ready — do not wait for onLayout
  // (SplashScreenManager can block layout while the splash is still showing).
  useEffect(() => {
    if (!ready) return
    void SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  useEffect(() => {
    void ScreenCapture.enableAppSwitcherProtectionAsync(1)
    return () => { void ScreenCapture.disableAppSwitcherProtectionAsync() }
  }, [])

  if (!ready) return null

  return (
    <SafeAreaProvider>
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
