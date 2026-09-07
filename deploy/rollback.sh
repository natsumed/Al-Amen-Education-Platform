#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
TARGET="${1:?Usage: rollback.sh <staging|production> <known-good-image-tag>}"
PREVIOUS_TAG="${2:?Usage: rollback.sh <staging|production> <known-good-image-tag>}"
cd "$ROOT_DIR"
exec "$ROOT_DIR/deploy.sh" "$TARGET" "$PREVIOUS_TAG"
