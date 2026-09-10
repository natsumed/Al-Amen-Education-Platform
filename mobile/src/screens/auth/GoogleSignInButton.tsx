import React, { useEffect, useState } from "react"
import type { ViewStyle } from "react-native"
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { PrimaryButton } from "../../components/PrimaryButton"

type Props = {
  webClientId: string
  iosClientId?: string
  label: string
  loading?: boolean
  totpCode: string
  onToken: (idToken: string, totpCode?: string) => Promise<void>
  onError: (error: unknown) => void
  onBusyChange: (busy: boolean) => void
  style?: ViewStyle
}

/**
 * Native Google sign-in is isolated from LoginScreen so a missing build-time
 * client ID can never throw while the password login screen is rendering.
 */
export function GoogleSignInButton({
  webClientId,
  iosClientId,
  label,
  loading,
  totpCode,
  onToken,
  onError,
  onBusyChange,
  style,
}: Props) {
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: false,
      })
      setConfigured(true)
    } catch (error) {
      onError(error)
    }
  }, [iosClientId, onError, webClientId])

  const signIn = async () => {
    if (!configured) return
    onBusyChange(true)
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      const response = await GoogleSignin.signIn()
      if (response.type !== "success" || !response.data.idToken) {
        return
      }
      await onToken(response.data.idToken, totpCode.trim() || undefined)
    } catch (error) {
      onError(error)
    } finally {
      onBusyChange(false)
    }
  }

  return (
    <PrimaryButton
      label={label}
      variant="outline"
      onPress={() => { void signIn() }}
      loading={loading || !configured}
      disabled={!configured}
      style={style}
    />
  )
}
