#!/usr/bin/env bash
# Diagnose USB phone visibility for Path A (Expo). Read-only — does not install.
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

echo "=== USB gadgets (phones) ==="
lsusb 2>/dev/null | grep -iE 'OPPO|Xiaomi|Samsung|Huawei|Google|OnePlus|Realme|Motorola|Android|22d9|18d1|04e8|2717' || {
  echo "(no known phone vendor in lsusb — cable / port / charge-only mode?)"
  lsusb 2>/dev/null | head -15 || true
}

echo ""
echo "=== adb devices ==="
adb start-server >/dev/null 2>&1 || true
adb devices -l

echo ""
AUTH="$(adb devices | awk '/unauthorized/{print}')"
NONE="$(adb devices | awk '/\tdevice$/{print}')"
if [[ -n "$AUTH" ]]; then
  echo "STATUS: phone is UNAUTHORIZED — unlock phone and tap Allow USB debugging."
  exit 2
fi
if [[ -z "$NONE" ]]; then
  echo "STATUS: phone on USB but adb does not see it (common on ColorOS / OPPO)."
  echo ""
  echo "On the phone:"
  echo "  1. Settings → About phone → tap Build number 7× (developer mode)"
  echo "  2. Developer options → USB debugging ON"
  echo "  3. Developer options → USB debugging (Security settings) ON (OPPO/ColorOS)"
  echo "  4. Developer options → Disable permission monitoring ON (if present)"
  echo "  5. Default USB configuration → File transfer / MTP (not Charge only)"
  echo "  6. Revoke USB debugging authorizations → unplug/replug → Allow this computer"
  echo ""
  echo "On the PC (once, needs your password):"
  echo "  sudo cp mobile/scripts/51-android.rules /etc/udev/rules.d/"
  echo "  sudo udevadm control --reload-rules && sudo udevadm trigger"
  echo "  adb kill-server && adb start-server && adb devices"
  exit 1
fi
echo "STATUS: ready — run: npm run android:usb"
exit 0
