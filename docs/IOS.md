# Amenallah — iOS (same Expo app as Android)

End users will install Amenallah via **TestFlight / App Store** (or an EAS internal install link for pilots). They never use Expo Go.

**Locked product direction:** one codebase under `mobile/` (Expo SDK 57 + React Native). **No** SwiftUI rewrite and **no** Jetpack Compose. iOS and Android share the same screens, auth JWT, and APIs.

This Linux workstation **cannot** run Xcode or the iOS Simulator. There is **no USB debugging workflow** for iOS here. All iOS binaries are produced with **EAS Build (cloud)**.

Product path (when live): website [**/download**](/download) → TestFlight / App Store (Android remains APK sideload).

## Architecture

```
[Standalone iOS Amenallah]
  UI → Nav (role) → AuthContext (JWT) → ApiClient
       → /api/mobile/auth/*  (Bearer HS256)
       → /api/content/* + /media
       → /api/parents/children
```

Same layers as Android — see [`docs/ANDROID.md`](ANDROID.md).

| Item | Value |
|------|--------|
| Bundle ID | `tn.amenallah.education` |
| Version | `app.json` → `expo.version` |
| Build number | `app.json` → `ios.buildNumber` (bump each store/internal build) |
| Scheme | `alamen://` |

## API URL (HTTPS required)

iOS App Transport Security blocks arbitrary cleartext HTTP. EAS `preview` / `production` / `development` profiles bake:

```text
EXPO_PUBLIC_API_URL=https://YOUR_PUBLIC_HOST
```

in [`mobile/eas.json`](../mobile/eas.json). Replace `REPLACE_WITH_YOUR_API_HOST` before shipping. Builds left on the placeholder are not usable for real users.

Android USB/emulator may still use HTTP locally (`adb reverse`, `10.0.2.2`) — that path does not apply to iOS.

## Build the iOS app (team)

1. Apple Developer Program membership (for device install / TestFlight / App Store).
2. Expo account: `npm i -g eas-cli && eas login`
3. In `mobile/`: `eas init` once (writes `extra.eas.projectId` into `app.json` if missing).
4. Set a real `https://…` URL in `eas.json` for the profile you will build.
5. Build:

   ```bash
   cd mobile
   npm run eas:build:ios          # internal / preview IPA
   # or
   npm run eas:build:ios:prod     # App Store profile
   npm run eas:build:all          # Android APK + iOS preview together
   ```

6. Install:
   - **Preview / internal:** open the install link from the Expo dashboard (QR) on an iPhone registered for the profile.
   - **Production:** `eas submit -p ios` → TestFlight → App Store.

Signing: EAS-managed credentials (prompted on first iOS build).

Bump `version` + `ios.buildNumber` in `app.json` each release (and Android `versionCode` when shipping both).

## Host / download page

| URL | Role |
|-----|------|
| `/download` | Android APK + iOS “TestFlight / bientôt” messaging |
| `/downloads/amenallah-latest.apk` | Android only (iOS is not sideloaded as a raw IPA on the website) |

## What we do **not** support on this laptop

- USB cable debugging to an iPhone
- Local `npx expo run:ios` / Simulator (needs macOS)
- Local `ios/` Xcode project builds (optional `npm run prebuild:ios` is for Mac CI only)

## Smoke checklist (on any iPhone later)

1. API HTTPS reachable at the URL baked into the build.
2. Install via TestFlight or EAS internal link.
3. Login with a test student → browse → open free content.
4. Deep links `alamen://content/:id` and `alamen://subscription` if registered.

Test account (same as Android): `student@edutunisia.tn` / `student123`.

## Related

- Android APK & USB: [`docs/ANDROID.md`](ANDROID.md)
- Mobile README: [`mobile/README.md`](../mobile/README.md)
