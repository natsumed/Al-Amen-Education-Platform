# Amenallah mobile (Expo)

Standalone **Android** and **iOS** apps from one Expo codebase. End users install from the website (`/download`) or TestFlight — not Expo Go.

**Stack locked:** Expo / React Native only. No Jetpack Compose / SwiftUI rewrite.

## Student app v1.1

- Five-tab learning flow: Home, Catalogue, Mes cours, Progression, Profil
- Search and grade/subject/type filters with cached offline fallback
- In-app video/PDF WebView, progress updates, reviews and related content
- Subscription status with web checkout bridge
- Student registration, password recovery, avatar/profile/password settings
- Parent invitations, parent child linking/progress, teacher library view
- FR/AR smart help and local subscription-expiry notifications

See also: [`docs/ANDROID.md`](../docs/ANDROID.md) · [`docs/IOS.md`](../docs/IOS.md).

## Product install path

**Android**

1. Scan QR → opens `https://<domain>/download`
2. Download `amenallah-latest.apk`
3. Allow install from browser → open Amenallah

**iOS** (same app, EAS cloud — needs Apple Developer + HTTPS API)

```bash
cd mobile
# Set EXPO_PUBLIC_API_URL to https://… in eas.json first
npm run eas:build:ios
# Install via Expo dashboard link / later TestFlight
```

Build & publish Android:

```bash
cd mobile
# Set EXPO_PUBLIC_API_URL in eas.json preview profile first
npm run eas:build:apk

# repo root — copy EAS artifact
../scripts/publish-mobile-apk.sh ~/Downloads/*.apk
NEXT_PUBLIC_APP_URL=https://your-domain.tn npm run qr:download
```

Scripts:

| Script | Purpose |
|--------|---------|
| `npm run eas:build:apk` | EAS cloud APK (`preview`) |
| `npm run eas:build:ios` | EAS cloud iOS (`preview`, internal) |
| `npm run eas:build:ios:prod` | EAS iOS App Store profile |
| `npm run eas:build:all` | Android + iOS preview |
| `npm run eas:build:local` | Android preview, local Gradle |
| `npm run eas:build:aab` | Play Store bundle (`production`) |
| `npm run android:usb` | USB phone + Metro (Android) |
| `npm run android:device` | Dev: native build on device/emulator |
| `npm start` / `start:usb` | Dev Metro only |

Release builds **require** a real `EXPO_PUBLIC_API_URL` (**HTTPS** for iOS). Android debug may use LAN / `adb reverse`.

## Dev (Metro / USB)

**Physical phone over USB (Path A — preferred):**

```bash
# Terminal 1 — repo root
npm run dev

# Terminal 2 — mobile/
npm run android:usb
```

Uses `adb reverse` so the phone talks to `http://127.0.0.1:3000` (API) and Metro on `8081`. Unlock the phone and accept the USB debugging prompt if `adb devices` is empty.

For engineers iterating on the emulator against a local Next.js API:

```bash
# Terminal 1 — API (must stay running; listens on 0.0.0.0:3000)
npm run dev
npm run smoke:mobile-auth   # must print OK

# Terminal 2 — emulator + APK (do not run Gradle while emulator is up)
cd mobile
npm run android:debug-apk   # or use existing cleartext APK below
./scripts/emulator-lite.sh &
adb wait-for-device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p tn.amenallah.education -c android.intent.category.LAUNCHER 1
```

**Login error « Impossible de joindre le serveur »** almost always means:
1. Next.js is not running on the PC, or
2. Wrong API URL, or  
3. APK blocked HTTP cleartext (rebuild / use cleartext-patched debug APK).

Emulator API URL: `http://10.0.2.2:3000`  
USB phone (with `adb reverse`): `http://127.0.0.1:3000`  
Phone on same Wi‑Fi: `http://<PC-LAN-IP>:3000` (long-press **Amenallah** on the login screen to set it).

Optional `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Test accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@edutunisia.tn | student123 |
| Teacher | teacher@edutunisia.tn | teacher123 |
| Parent | parent@edutunisia.tn | parent123 |

## Architecture

```
mobile/src/
  theme/           design tokens (#2040e0)
  components/      Screen, Button, Card, …
  lib/             api, auth, i18n FR/AR
  navigation/      role-based tabs + stacks
  screens/         auth, student, teacher, parent
```

| Role | Mobile |
|------|--------|
| Student / Teacher | Tabs: Home · Catalogue · Profile |
| Parent | Tabs: Home · Children (+ pay on web) |
| Admin | Use the web app |
