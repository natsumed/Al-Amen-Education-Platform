declare module "vdocipher-rn-bridge" {
  import type { ComponentType } from "react"
  import type { StyleProp, ViewStyle } from "react-native"

  export type EmbedInfo = { otp: string; playbackInfo: string }
  export type VdoPlayerProps = {
    embedInfo: EmbedInfo
    style?: StyleProp<ViewStyle>
    showNativeControls?: boolean
    autoPlay?: boolean
    onProgress?: (event: { currentTime: number }) => void
    onMediaEnded?: () => void
    onError?: (event: { errorDescription?: { errorCode?: number; errorMsg?: string } }) => void
  }
  export const VdoPlayerView: ComponentType<VdoPlayerProps>
}
