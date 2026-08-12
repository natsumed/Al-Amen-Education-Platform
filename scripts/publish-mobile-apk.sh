#!/usr/bin/env bash
# Copy an EAS-built APK into the Next.js public downloads folder.
# Usage:
#   ./scripts/publish-mobile-apk.sh /path/to/amenallah.apk
#   ./scripts/publish-mobile-apk.sh https://expo.dev/.../artifact.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="$ROOT/public/downloads"
DEST="$DEST_DIR/amenallah-latest.apk"
SRC="${1:-}"

if [[ -z "$SRC" ]]; then
  echo "Usage: $0 <path-or-url-to-apk>"
  echo "After EAS: eas build:list --platform android --profile preview"
  echo "Then download the artifact and run this script."
  exit 1
fi

mkdir -p "$DEST_DIR"

if [[ "$SRC" =~ ^https?:// ]]; then
  echo "Downloading APK…"
  curl -fsSL -L -o "$DEST" "$SRC"
else
  cp -f "$SRC" "$DEST"
fi

ls -lh "$DEST"
echo "Served at: /downloads/amenallah-latest.apk"
echo "Page: /download"
