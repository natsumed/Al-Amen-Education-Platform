# Amenallah Android (Expo)

Native React Native app. Use **Expo Go on a phone** — not the browser preview.

## Why Expo Go fails

`java.io.IOException: failed to download remote update` almost always means the phone **cannot reach Metro on :8081**.

| Method | When to use |
|--------|-------------|
| **USB** (`npm run start:usb`) | Best when Wi‑Fi blocks device-to-PC, or ngrok fails |
| **LAN** (`npm start`) | Same Wi‑Fi, no client isolation |
| **Tunnel** (`npm run start:tunnel`) | Last resort — currently often fails (`remote gone away`) |

Ngrok outages: https://status.ngrok.com/

---

## Method A — USB (recommended right now)

1. One-time adb install (no sudo; downloads into `mobile/tools/`):

   ```bash
   cd mobile
   npm run setup:adb
   ```

2. On the phone: **Developer options → USB debugging ON**, plug USB, accept the prompt.

3. API (repo root):

   ```bash
   npm run dev
   ```

4. Metro (`mobile/`):

   ```bash
   npm run start:usb
   ```

5. In **Expo Go** → Enter URL:

   ```
   exp://127.0.0.1:8081
   ```

   (Do not scan a LAN QR for USB mode.)

---

## Method B — LAN (same Wi‑Fi)

Your PC currently has Wi‑Fi IP around `192.168.x.x`. Phone must be on that same subnet.

```bash
# repo root
npm run dev

# mobile/
npm start
# prints Metro URL like exp://192.168.149.142:8081
```

Open that URL in Expo Go (or scan QR). If it still fails → use USB.

Optional override in `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.149.142:3000
```

---

## Checklist

1. Expo Go supports **SDK 57** (update from Play Store).
2. Next.js on **:3000**, Metro on **:8081**.
3. Open the project **inside Expo Go**, not Chrome.
4. This repo has **EAS Updates disabled** (no fake `projectId`).

## Test accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@edutunisia.tn | student123 |
| Teacher | teacher@edutunisia.tn | teacher123 |
| Parent | parent@edutunisia.tn | parent123 |

## Architecture

```
mobile/src/
  theme/           design tokens
  components/      Screen, Button, Card, …
  lib/             api, auth, i18n
  navigation/      role-based tabs + stacks
  screens/         auth, student, teacher, parent
```

| Role | Mobile |
|------|--------|
| Student / Teacher | Tabs: Home · Catalogue · Profile |
| Parent | Tabs: Home · Children |
| Admin | Use the web app |
