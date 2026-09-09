# Android APK hosting (sideload pilot)

Place the signed standalone APK here after each approved EAS direct build:

```bash
# From repo root — after downloading the EAS artifact
./scripts/publish-mobile-apk.sh ~/Downloads/amenallah-*.apk
```

Expected persistent server path:

- `/downloads/android/{version}/{build}/amenallah.apk`

The download page is `/download`. The QR code and mobile smart link use `/app`,
which redirects Android phones to the current APK and iOS devices to the
published TestFlight/App Store URL. Never serve AABs, IPA files, keystores, or
EAS credentials from this directory.

The `.apk` itself is gitignored (large binary). Commit this README only.
