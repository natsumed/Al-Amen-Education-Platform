#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
TARGET="${1:?Usage: restore.sh <staging|production> <absolute-dump-path> --confirm}"
DUMP_PATH="${2:?Usage: restore.sh <staging|production> <absolute-dump-path> --confirm}"
CONFIRMATION="${3:-}"
COMPOSE=(docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml")

[[ "$CONFIRMATION" == "--confirm" ]] || { echo "Restore requires --confirm" >&2; exit 2; }
[[ "$DUMP_PATH" = /* && -f "$DUMP_PATH" ]] || { echo "Dump must be an existing absolute path" >&2; exit 2; }

case "$TARGET" in
  staging) app_service=staging-app; db_service=staging-db ;;
  production) app_service=prod-app; db_service=prod-db ;;
  *) echo "Unknown target: $TARGET" >&2; exit 2 ;;
esac

cd "$ROOT_DIR"
restart_app() { "${COMPOSE[@]}" up -d "$app_service" >/dev/null 2>&1 || true; }
trap restart_app EXIT

"${COMPOSE[@]}" stop "$app_service"
"${COMPOSE[@]}" exec -T "$db_service" pg_restore \
  --username=platform --dbname=platform --clean --if-exists --no-owner < "$DUMP_PATH"
"${COMPOSE[@]}" run --rm "$app_service" npx prisma migrate deploy
"${COMPOSE[@]}" up -d "$app_service"
"${COMPOSE[@]}" exec -T "$app_service" node -e \
  "fetch('http://' + process.env.HOSTNAME + ':3000/api/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
trap - EXIT
echo "Restored $TARGET from $DUMP_PATH"
