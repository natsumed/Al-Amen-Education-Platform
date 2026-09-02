#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
COMPOSE=(docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml")
IMAGE_TAG_INPUT="${1:?Usage: deploy.sh <immutable-image-tag>}"

cd "$ROOT_DIR"
export IMAGE_TAG="$IMAGE_TAG_INPUT"

"${COMPOSE[@]}" pull prod-app staging-app
"${COMPOSE[@]}" run --rm prod-app npx prisma migrate deploy
"${COMPOSE[@]}" run --rm staging-app npx prisma migrate deploy
"${COMPOSE[@]}" up -d --remove-orphans
"${COMPOSE[@]}" ps

for service in prod-app staging-app; do
  for attempt in {1..20}; do
    if "${COMPOSE[@]}" exec -T "$service" node -e "fetch('http://' + process.env.HOSTNAME + ':3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; then
      break
    fi
    if [[ "$attempt" == 20 ]]; then
      echo "Health check failed for $service" >&2
      exit 1
    fi
    sleep 3
  done
done
