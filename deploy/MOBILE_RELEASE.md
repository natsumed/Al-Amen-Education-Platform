# Mobile release and app-link handoff

The repository contains the direct APK, Play AAB, and iOS TestFlight EAS
profiles. Android direct distribution is independent from iOS approval.

1. Set the EAS project and protected `EXPO_TOKEN`, then run the protected
   `Mobile release` workflow with `android-direct`.
2. Configure protected GitHub secrets `MOBILE_RELEASE_SSH_HOST`,
   `MOBILE_RELEASE_SSH_USER`, `MOBILE_RELEASE_SSH_KEY`, and
   `MOBILE_RELEASE_SSH_KNOWN_HOSTS` for the restricted VPS deploy account.
3. The approved workflow downloads its exact EAS build, verifies its signature
   and package name, uploads it atomically, registers an unpublished database
   record, verifies HTTPS delivery, and only then publishes it. The `/app`
   resolver only uses the published release.
4. Use `android-store` for the Play AAB and `ios-testflight` for iOS. Never put
   an AAB, IPA, keystore, or App Store credential in `/srv/amenallah/releases`.

Before app links can be verified, add the actual EAS Android SHA-256 signing
fingerprint to `public/.well-known/assetlinks.json` and the Apple Developer Team
ID to `public/.well-known/apple-app-site-association`. These values are
provider credentials/build outputs and must not be guessed. Until then, normal
HTTPS fallback routing remains functional.

The mobile Google client IDs are non-secret EAS environment variables. Google
server secrets, Apple identifiers, attestation credentials, and EAS tokens are
protected environment secrets only.
