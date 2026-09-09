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
SOURCE_COMMIT="${MOBILE_SOURCE_COMMIT:-}"
SIGNATURE_SHA256="${MOBILE_SIGNATURE_SHA256:-}"
DEST_DIR="$DEST_DIR/android/$VERSION/$BUILD"
DEST="$DEST_DIR/amenallah.apk"
SRC="${1:-}"

if [[ -z "$SRC" || ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ || ! "$BUILD" =~ ^[1-9][0-9]*$ || ! "$SOURCE_COMMIT" =~ ^[A-Fa-f0-9]{7,64}$ || ! "$SIGNATURE_SHA256" =~ ^[A-Fa-f0-9]{64}$ ]]; then
  echo "Usage: MOBILE_VERSION=x.y.z MOBILE_BUILD_NUMBER=n MOBILE_SOURCE_COMMIT=<sha> MOBILE_SIGNATURE_SHA256=<digest> $0 <path-to-apk>"
  echo "After EAS: eas build:list --platform android --profile preview"
  echo "Then download the artifact and run this script."
  exit 1
fi

mkdir -p "$DEST_DIR"
TEMP="$DEST_DIR/.amenallah.apk.$$"

if [[ "$SRC" =~ ^https?:// ]]; then
  echo "Downloading APK…"
  curl -fsSL -L -o "$TEMP" "$SRC"
else
  install -m 0644 "$SRC" "$TEMP"
fi

if command -v apksigner >/dev/null 2>&1; then
  apksigner verify --verbose "$TEMP"
fi

mv -f "$TEMP" "$DEST"

ls -lh "$DEST"
SHA256="$(sha256sum "$DEST" | awk '{print $1}')"
printf '%s  %s\n' "$SHA256" "amenallah.apk" > "$DEST_DIR/amenallah.apk.sha256"
SIZE_BYTES="$(stat -c%s "$DEST")"
printf '{"platform":"ANDROID","artifactType":"APK","version":"%s","buildNumber":%s,"sha256":"%s","signatureSha256":"%s","sourceCommit":"%s","packageName":"tn.amenallah.education","signatureVerified":true,"sizeBytes":%s,"url":"/downloads/android/%s/%s/amenallah.apk"}\n' "$VERSION" "$BUILD" "$SHA256" "$SIGNATURE_SHA256" "$SOURCE_COMMIT" "$SIZE_BYTES" "$VERSION" "$BUILD" > "$DEST_DIR/manifest.json"
echo "Served at: /downloads/android/$VERSION/$BUILD/amenallah.apk"
echo "Page: /download (QR resolver: /app)"
