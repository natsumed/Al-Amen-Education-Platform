#!/usr/bin/env bash
# Download Google platform-tools (adb) into mobile/tools/ — no sudo needed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/tools"
mkdir -p "$DEST"
cd "$DEST"

if [[ -x "$DEST/platform-tools/adb" ]]; then
  echo "Already installed: $DEST/platform-tools/adb"
  "$DEST/platform-tools/adb" version
  exit 0
fi

echo "Downloading Android platform-tools…"
curl -fsSL -o platform-tools.zip https://dl.google.com/android/repository/platform-tools-latest-linux.zip
unzip -qo platform-tools.zip
rm -f platform-tools.zip
chmod +x platform-tools/adb

export HOME="${ADB_HOME_OVERRIDE:-$DEST/adb-home}"
mkdir -p "$HOME/.android"
"$DEST/platform-tools/adb" version
echo ""
echo "Done. Run:  npm run start:usb"
