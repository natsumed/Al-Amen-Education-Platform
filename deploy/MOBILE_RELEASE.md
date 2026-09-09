# Mobile release and app-link handoff

The repository contains the direct APK, Play AAB, and iOS TestFlight EAS
profiles. Android direct distribution is independent from iOS approval.

1. Set the production EAS project and credentials, then run the protected
   `Mobile release` workflow with `android-direct`.
2. Download the APK, verify it with `apksigner`, and run
   `MOBILE_VERSION=... MOBILE_BUILD_NUMBER=... ./scripts/publish-mobile-apk.sh
   artifact.apk` on the release host.
3. Create an unpublished release with `POST /api/admin/mobile/releases` as an
   administrator, review the checksum and signature, then publish it with the
   admin PATCH endpoint. The `/app` resolver only uses published releases.
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
