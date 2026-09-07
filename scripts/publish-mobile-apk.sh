#!/usr/bin/env bash
# Copy an EAS-built APK into the persistent server release directory.
# Usage:
#   ./scripts/publish-mobile-apk.sh /path/to/amenallah.apk
#   ./scripts/publish-mobile-apk.sh https://expo.dev/.../artifact.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="${AMENALLAH_RELEASE_DIR:-/srv/amenallah/releases}"
VERSION="${MOBILE_VERSION:-1.2.0}"
DEST="$DEST_DIR/amenallah-${VERSION}.apk"
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
sha256sum "$DEST"
echo "Served at: /downloads/amenallah-${VERSION}.apk"
echo "Page: /download"
