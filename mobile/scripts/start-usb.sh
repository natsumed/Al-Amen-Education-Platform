#!/usr/bin/env bash
# USB + adb reverse — works when Wi‑Fi isolation blocks LAN and ngrok tunnel fails.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REAL_HOME="${HOME}"

# Prefer project-bundled adb, then PATH
ADB_BIN="${ADB_BIN:-}"
if [[ -z "$ADB_BIN" ]]; then
  if [[ -x "$ROOT/tools/platform-tools/adb" ]]; then
    ADB_BIN="$ROOT/tools/platform-tools/adb"
  elif command -v adb >/dev/null 2>&1; then
    ADB_BIN="$(command -v adb)"
  fi
fi

if [[ -z "${ADB_BIN:-}" ]]; then
  echo "adb not found."
  echo "From mobile/:  npm run setup:adb"
  echo "Then plug the phone (USB debugging ON) and:  npm run start:usb"
  exit 1
fi

run_adb() {
  # adb always writes under $HOME/.android — keep that inside the project
  HOME="${ADB_HOME_OVERRIDE:-$ROOT/tools/adb-home}" mkdir -p "${ADB_HOME_OVERRIDE:-$ROOT/tools/adb-home}/.android"
  HOME="${ADB_HOME_OVERRIDE:-$ROOT/tools/adb-home}" "$ADB_BIN" "$@"
}

echo "Using adb: $ADB_BIN"
echo "Waiting for USB device (enable USB debugging + allow this PC)…"
run_adb wait-for-device
run_adb devices -l

# Phone's 127.0.0.1 → this PC (Metro + Next.js API)
run_adb reverse tcp:8081 tcp:8081
run_adb reverse tcp:3000 tcp:3000
echo "adb reverse: 8081 (Metro) + 3000 (API) OK"

export HOME="$REAL_HOME"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://127.0.0.1:3000}"
echo ""
echo "In Expo Go (dev only) → Enter URL manually:"
echo "  exp://127.0.0.1:8081"
echo ""
echo "Keep Next.js running on :3000 in another terminal (repo root: npm run dev)."
echo ""

exec npx expo start --localhost --clear "$@"
