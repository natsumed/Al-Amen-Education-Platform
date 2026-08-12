# Android APK hosting (sideload pilot)

Place the standalone APK here after each EAS preview build:

```bash
# From repo root — after downloading the EAS artifact
./scripts/publish-mobile-apk.sh ~/Downloads/amenallah-*.apk
```

Expected file (served by Next.js):

- `/downloads/amenallah-latest.apk` → `public/downloads/amenallah-latest.apk`

The download page is `/download`. QR codes must encode that page URL, not Expo Go / `exp://`.

The `.apk` itself is gitignored (large binary). Commit this README only.
