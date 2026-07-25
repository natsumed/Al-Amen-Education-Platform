# Al-Amen — Android plan

## Approach: Expo (React Native)

Native Android client in `/mobile`. Fix Expo Go LAN issues first (see `mobile/README.md`). Browser preview is **not** the product UI.

### Expo Go “failed to download remote update”

Usually caused by phone not reaching Metro `:8081` (Wi‑Fi isolation / firewall). Ngrok tunnel often fails with `remote gone away`.

**Preferred fix:** USB — `cd mobile && npm run setup:adb && npm run start:usb`, then open `exp://127.0.0.1:8081` in Expo Go.

Also: Expo Go must support SDK 57; EAS Updates are disabled in `app.json`.

## Architecture

```
mobile/src/
  theme/           tokens (brand #2040e0)
  components/      Screen, PrimaryButton, ContentCard, …
  lib/             api (Bearer), auth, i18n FR/AR
  navigation/      Learner tabs | Parent tabs | Admin blocked
  screens/         auth, student, teacher, parent
```

```
[Expo Go / APK] --Bearer JWT--> [Next.js /api/mobile/* + /api/content/*]
```

- Web: Auth.js cookies
- Mobile: `/api/mobile/auth/login` → HS256 token (`AUTH_SECRET`)
- Media gated via `/api/content/:id/media`

## Roadmap

1. **Now** — Expo app in `/mobile` (login, browse, detail, Drive open)
2. **When Drive ready** — paste links in admin; no mobile code change required
3. **When domain ready** — set `EXPO_PUBLIC_API_URL`, EAS build, Play Store
4. **Phase 2** — push notifications, offline cache, parent progress on mobile

## Run locally

See `mobile/README.md`.
