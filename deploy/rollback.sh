#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
PREVIOUS_TAG="${1:?Usage: rollback.sh <known-good-image-tag>}"
cd "$ROOT_DIR"
export IMAGE_TAG="$PREVIOUS_TAG"
docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml" up -d prod-app staging-app
docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml" ps
