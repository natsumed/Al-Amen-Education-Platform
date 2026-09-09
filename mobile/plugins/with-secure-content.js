const { withAndroidManifest } = require("expo/config-plugins")

/**
 * Prevent Android from exposing application audio to MediaProjection-based
 * recorders. Visual capture protection is activated only on protected screens
 * by expo-screen-capture so ordinary app pages remain usable.
 */
module.exports = function withSecureContent(config) {
  return withAndroidManifest(config, (result) => {
    const application = result.modResults.manifest.application?.[0]
    if (application) {
      application.$["android:allowAudioPlaybackCapture"] = "false"
      application.$["android:usesCleartextTraffic"] = "false"
    }
    return result
  })
}
