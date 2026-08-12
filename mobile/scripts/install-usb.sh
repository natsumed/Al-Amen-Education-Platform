#!/usr/bin/env bash
# Path A: install Amenallah debug APK on a USB phone and run Metro.
# Requires: USB debugging ON, phone unlocked, "Allow USB debugging" accepted.
# Keep Next.js running on :3000 in another terminal (repo root: npm run dev).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

APK="${APK:-$ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://127.0.0.1:3000}"

if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Run: npm run setup:adb"
  exit 1
fi

echo "============================================"
echo " Amenallah USB (Expo Path A — not Compose)"
echo "============================================"
echo " API URL for phone: $EXPO_PUBLIC_API_URL"
echo " (adb reverse maps phone 127.0.0.1 → this PC)"
echo ""

# API must be up
api_code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 http://127.0.0.1:3000/ || true)"
if [[ ! "$api_code" =~ ^[23] ]]; then
  echo "Next.js is not reachable on http://127.0.0.1:3000 (HTTP ${api_code:-000})."
  echo "In another terminal (repo root):  npm run dev"
  exit 1
fi
echo "API OK (HTTP $api_code)"

if [[ ! -f "$APK" ]]; then
  echo "Missing debug APK: $APK"
  echo "Build it first (emulator OFF):  npm run android:debug-apk"
  exit 1
fi

echo "Waiting for USB device…"
echo "  → Unlock phone, USB = File transfer (MTP), accept debugging prompt"
echo "  → OPPO/ColorOS: also enable « USB debugging (Security settings) »"
adb start-server >/dev/null 2>&1 || true

# Help adb discover OPPO/OnePlus vendor IDs
mkdir -p "${HOME}/.android"
if [[ -w "${HOME}/.android" ]]; then
  touch "${HOME}/.android/adb_usb.ini"
  grep -q '0x22d9' "${HOME}/.android/adb_usb.ini" 2>/dev/null || echo '0x22d9' >> "${HOME}/.android/adb_usb.ini"
fi

# Fast fail with diagnostics if nothing appears within 45s
if ! timeout 45 adb wait-for-device; then
  echo ""
  echo "Timed out waiting for adb device."
  bash "$ROOT/scripts/usb-check.sh" || true
  exit 1
fi
adb devices -l

SERIAL="$(adb devices | awk '/\tdevice$/{print $1; exit}')"
if [[ -z "${SERIAL:-}" ]]; then
  if adb devices | grep -q unauthorized; then
    echo "Device unauthorized — unlock the phone and accept the RSA fingerprint dialog."
  else
    bash "$ROOT/scripts/usb-check.sh" || true
  fi
  exit 1
fi
echo "Using device: $SERIAL"

adb -s "$SERIAL" reverse tcp:3000 tcp:3000
adb -s "$SERIAL" reverse tcp:8081 tcp:8081
adb -s "$SERIAL" reverse --list
echo "adb reverse: 3000 (API) + 8081 (Metro) OK"

echo "Installing APK…"
adb -s "$SERIAL" uninstall tn.amenallah.education 2>/dev/null || true
adb -s "$SERIAL" install -r "$APK"

adb -s "$SERIAL" shell am start -n tn.amenallah.education/.MainActivity >/dev/null || \
  adb -s "$SERIAL" shell monkey -p tn.amenallah.education -c android.intent.category.LAUNCHER 1 >/dev/null

echo ""
echo "App launched. Starting Metro (JS for debug APK)…"
echo "Login: student@edutunisia.tn / student123"
echo "If API fails: long-press Amenallah → set http://127.0.0.1:3000"
echo ""

exec npx expo start --port 8081 --localhost
