#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
RESTIC_ENV_FILE="${RESTIC_ENV_FILE:-$ROOT_DIR/restic.env}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
COMPOSE=(docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml")

[[ -f "$RESTIC_ENV_FILE" ]] || { echo "Missing $RESTIC_ENV_FILE" >&2; exit 1; }
cd "$ROOT_DIR"

"${COMPOSE[@]}" exec -T prod-db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --format=custom --no-owner --username=platform --dbname=platform' \
  | docker run --rm -i --env-file "$RESTIC_ENV_FILE" restic/restic:0.18.0 backup --stdin --stdin-filename "postgres-$STAMP.dump"

docker run --rm --env-file "$RESTIC_ENV_FILE" -v "$ROOT_DIR:/backup:ro" restic/restic:0.18.0 \
  backup /backup --exclude runtime.env --exclude restic.env --exclude caddy_data --exclude caddy_config

docker run --rm --env-file "$RESTIC_ENV_FILE" restic/restic:0.18.0 forget \
  --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
