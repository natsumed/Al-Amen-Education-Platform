#!/usr/bin/env bash
# Copy an EAS-built APK into the persistent server release directory.
# Usage:
#   ./scripts/publish-mobile-apk.sh /path/to/amenallah.apk
#   ./scripts/publish-mobile-apk.sh https://expo.dev/.../artifact.apk
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="${AMENALLAH_RELEASE_DIR:-/srv/amenallah/releases}"
VERSION="${MOBILE_VERSION:-1.2.0}"
BUILD="${MOBILE_BUILD_NUMBER:-1}"
DEST_DIR="$DEST_DIR/android/$VERSION/$BUILD"
DEST="$DEST_DIR/amenallah.apk"
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
  install -m 0644 "$SRC" "$DEST"
fi

if command -v apksigner >/dev/null 2>&1; then
  apksigner verify --verbose "$DEST"
fi

ls -lh "$DEST"
SHA256="$(sha256sum "$DEST" | awk '{print $1}')"
printf '%s  %s\n' "$SHA256" "amenallah.apk" > "$DEST_DIR/amenallah.apk.sha256"
printf '{"platform":"ANDROID","artifactType":"APK","version":"%s","buildNumber":%s,"sha256":"%s","url":"/downloads/android/%s/%s/amenallah.apk"}\n' "$VERSION" "$BUILD" "$SHA256" "$VERSION" "$BUILD" > "$DEST_DIR/manifest.json"
echo "Served at: /downloads/android/$VERSION/$BUILD/amenallah.apk"
echo "Page: /download (QR resolver: /app)"
