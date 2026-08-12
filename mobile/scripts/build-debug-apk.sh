#!/usr/bin/env bash
# Build a debug APK with EXPO_PUBLIC_API_URL for the Android emulator (10.0.2.2).
# Do NOT run the emulator at the same time on low-RAM machines.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="${JAVA_HOME:-$HOME/jdks/jdk-17.0.20+8}"
export PATH="$JAVA_HOME/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://10.0.2.2:3000}"

printf '%s\n' "EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL" > .env
echo "Building debug APK with API=$EXPO_PUBLIC_API_URL"

# Keep cleartext enabled (Expo prebuild can drop it)
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [[ -f "$MANIFEST" ]] && ! grep -q 'usesCleartextTraffic="true"' "$MANIFEST"; then
  echo "WARN: patching AndroidManifest cleartext…"
  python3 - <<'PY'
from pathlib import Path
p = Path("android/app/src/main/AndroidManifest.xml")
t = p.read_text()
if 'usesCleartextTraffic' not in t:
    t = t.replace(
        "<application ",
        '<application android:usesCleartextTraffic="true" ',
        1,
    )
    p.write_text(t)
    print("patched usesCleartextTraffic")
PY
fi

cd android
./gradlew assembleDebug \
  -Dorg.gradle.java.home="$JAVA_HOME" \
  --no-daemon \
  --max-workers=1 \
  -Dorg.gradle.jvmargs="-Xmx1536m"

APK="app/build/outputs/apk/debug/app-debug.apk"
ls -lh "$APK"
echo "OK: $ROOT/android/$APK"
echo "Install: adb install -r $ROOT/android/$APK"
