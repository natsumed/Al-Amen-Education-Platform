# Amenallah — Android standalone APK

End users install a **signed standalone APK** (EAS Build `preview`). They never use Expo Go.

**Locked product direction (2026):** Amenallah Android stays on **Expo / React Native**. We are **not** rewriting the app in Jetpack Compose. UI work continues in `mobile/` (RN). Native Compose would mean a full second codebase against the same APIs — out of scope.

Product path: scan QR → [**/download**](/download) → install `/downloads/amenallah-latest.apk`.

iOS uses the **same Expo app** — see [`docs/IOS.md`](IOS.md) (EAS cloud IPA / TestFlight; no USB on this laptop).

## Architecture

```
[Standalone APK Amenallah]
  UI → Nav (role) → AuthContext (JWT) → ApiClient
       → /api/mobile/auth/*  (Bearer HS256)
       → /api/content/* + /media
       → /api/parents/children
```

| Layer | Path |
|-------|------|
| Shell | `mobile/App.tsx`, splash |
| Navigation | `mobile/src/navigation/` |
| Screens | `mobile/src/screens/` |
| Data | `mobile/src/lib/api.ts`, auth |
| Theme / assets | `mobile/src/theme/`, `mobile/assets/` |
| Config | `mobile/app.json`, `mobile/eas.json` |

Package: `tn.amenallah.education`. Roles: Student/Teacher learner tabs; Parent; Admin → web.

## Build the APK (team)

1. Install EAS CLI and log in: `npm i -g eas-cli && eas login`
2. In `mobile/`: `eas init` once (writes real `extra.eas.projectId` into `app.json`)
3. Set the production/staging API URL in `mobile/eas.json` (`preview` / `production` → `EXPO_PUBLIC_API_URL`). Must be a real `https://…` reachable from phones — never leave `REPLACE_WITH_YOUR_API_HOST`.
4. Build:

   ```bash
   cd mobile
   npm run eas:build:apk          # cloud APK (preview)
   # or
   npm run eas:build:local        # local Gradle if cloud credits unavailable
   ```

5. Publish the artifact to the website:

   ```bash
   # from repo root
   ./scripts/publish-mobile-apk.sh /path/to/artifact.apk
   ```

6. Regenerate the QR if the public site URL changed:

   ```bash
   NEXT_PUBLIC_APP_URL=https://your-domain.tn npm run qr:download
   ```

`production` profile builds an **AAB** for Play Store later (`npm run eas:build:aab`).

Bump `version` + Android `versionCode` in `app.json` each release. Signing: EAS-managed credentials (prompted on first build).

## Host / download page

| URL | Role |
|-----|------|
| `/download` | FR/AR install instructions + logo + button |
| `/downloads/amenallah-latest.apk` | Sideload binary (`public/downloads/`, gitignored) |
| `/images/android-download-qr.png` | QR → **download page** (not raw APK, not `exp://`) |

Navbar marketing link: **App Android**.

Security note on page: install only from Amenallah; APK signed by project keystore.

## Smoke-test (real phone)

1. Next.js API reachable at the URL baked into the APK (`EXPO_PUBLIC_API_URL`).
2. Open `/download` on the phone (or scan QR).
3. Download APK → allow install from browser → open Amenallah.
4. Login with a test student → browse → open free content.
5. Long-press brand on login screen → confirm API base (debug).

Pilot without public domain: use LAN/`NEXT_PUBLIC_APP_URL` and regenerate the QR.

## Dev workflow (engineers only)

Prefer **Dev Client / `npx expo run:android`** over Expo Go.

### Fix: « Impossible de joindre le serveur »

That message means the app cannot TCP-connect to the API (not bad password). Checklist:

1. **API running on the PC** — from repo root: `npm run dev` (listens on `0.0.0.0:3000`).
2. **Smoke test on the PC**: `npm run smoke:mobile-auth` → must print `OK: mobile login works`.
3. **Correct API URL in the app**
   - Emulator: `http://10.0.2.2:3000` (special alias to the host loopback)
   - Physical phone (same Wi‑Fi): `http://<PC-LAN-IP>:3000`
   - USB phone: `adb reverse tcp:3000 tcp:3000` then `http://127.0.0.1:3000`
4. **Long-press the brand name** on the login screen → set / save API URL (stored in AsyncStorage).
5. **HTTP cleartext** must be allowed (`usesCleartextTraffic` in `app.json` + AndroidManifest). Rebuild the APK after changing native network config.

Test account: `student@edutunisia.tn` / `student123`.

### Physical phone over USB (Path A — preferred on this laptop)

Debug APKs load JS from **Metro**. USB + `adb reverse` avoids Wi‑Fi / LAN issues.

```bash
# Terminal 1 — API (repo root)
npm run dev

# Terminal 2 — phone install + Metro (mobile/)
cd mobile
npm run android:usb
```

What `android:usb` does:

1. Waits for a USB device (`adb devices` must show your phone — unlock + allow debugging).
2. `adb reverse tcp:3000` and `tcp:8081` (phone `127.0.0.1` → PC).
3. Installs `android/app/build/outputs/apk/debug/app-debug.apk` (build first with `npm run android:debug-apk` if missing).
4. Starts Metro with `EXPO_PUBLIC_API_URL=http://127.0.0.1:3000`.
5. Launches Amenallah.

If login still says the server is unreachable: long-press **Amenallah** on the login screen → set API to `http://127.0.0.1:3000` → save.

**OPPO / ColorOS (e.g. A78):** if `lsusb` shows the phone but `adb devices` is empty, run `npm run android:usb-check`, enable **USB debugging (Security settings)**, set USB to **File transfer**, then once on the PC:

```bash
sudo cp mobile/scripts/51-android.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && sudo udevadm trigger
adb kill-server && adb devices
```

**Not in scope:** Jetpack Compose rewrite. Keep enhancing RN screens under `mobile/src/`.

### Low-resource emulator (this laptop)

Android SDK is at `~/Android/Sdk`. AVD: `Amenallah_API34` (1.5 GB RAM, 2 cores, software GPU).

**Never run Gradle and the emulator at the same time** — build the APK first, then start the emulator.

```bash
# 0) API (keep this terminal open)
npm run dev
npm run smoke:mobile-auth

# 1) Build debug APK (no emulator) — embeds http://10.0.2.2:3000
cd mobile
npm run android:debug-apk

# 2) Start lite emulator
./scripts/emulator-lite.sh &
# wait until: adb devices shows emulator-5554

# 3) Install + launch
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p tn.amenallah.education -c android.intent.category.LAUNCHER 1

# 4) Login: student@edutunisia.tn / student123
# If still unreachable: long-press « Amenallah » → set API to http://10.0.2.2:3000

# 5) When done — free RAM
adb emu kill
```

USB/LAN Metro scripts remain helpers for debug only — see `mobile/README.md`. Release users never see Expo Go.

## Native modules (require a rebuild)

v1.2.0 added native modules — the APK must be rebuilt (a JS-only OTA is not enough):
`@expo/vector-icons`, `expo-image`, `expo-font` (+ `@expo-google-fonts/cairo`),
`@react-native-community/netinfo`, `expo-clipboard`. Config plugins for `expo-image`
and `expo-font` are already in `app.json`.

Remote push is best-effort and no-ops until an EAS `projectId` exists. Once you run
`eas init`, add it under `expo.extra.eas.projectId` in `app.json` so
`getExpoPushTokenAsync` can mint device tokens; the backend endpoint
(`/api/mobile/push/register`), `DeviceToken` model, and Expo sender (`src/lib/push.ts`)
are already in place.

## QA checklist (v1.2.0)

- Tabs: Accueil, Explorer, Mes cours, Progression, Profil render with vector icons.
- Home: greeting, subscription card, stats, Continue rail, "Gratuit à découvrir" rail, invitations.
- Explorer: search, quick grade chips, filter sheet (grade/subject/type/free), pagination on scroll.
- Content detail: WebView player (YouTube/Drive/PDF), progress bar, mark complete, star reviews, related carousel, share, locked upsell.
- Auth: register with role (student/teacher/parent) auto-logs in; forgot password.
- Profile/Settings: copy account ID, avatar upload, language selector (FR/AR), change password.
- Teacher: hub cards. Parent: children list → child detail with progress; pay opens web.
- Offline: airplane mode shows banner; progress writes queue and flush on reconnect.
- FR/AR toggle persists across restarts; deep links `alamen://content/:id` and `alamen://subscription`.

## Roadmap (later)

Streaming AI chat parity, in-app payment SDKs (needs `payments/create` on `getRequestUser`),
offline media downloads (`expo-file-system`), teacher content upload.
