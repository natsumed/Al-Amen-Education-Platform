const { withInfoPlist, IOSConfig } = require("expo/config-plugins")

/**
 * The native Google package only needs an iOS URL scheme on iOS. Android
 * receives its client configuration at runtime through GoogleSignin.configure.
 * Keeping this plugin conditional lets password login and Android startup work
 * when OAuth credentials have not yet been provisioned.
 */
module.exports = function withGoogleSignIn(config) {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()
  if (!iosClientId) return config

  const clientIdWithoutSuffix = iosClientId.replace(/\.apps\.googleusercontent\.com$/, "")
  const scheme = `com.googleusercontent.apps.${clientIdWithoutSuffix}`

  return withInfoPlist(config, (result) => {
    if (!IOSConfig.Scheme.hasScheme(scheme, result.modResults)) {
      result.modResults = IOSConfig.Scheme.appendScheme(scheme, result.modResults)
    }
    return result
  })
}
