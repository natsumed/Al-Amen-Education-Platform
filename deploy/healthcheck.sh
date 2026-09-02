#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
COMPOSE=(docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml")
cd "$ROOT_DIR"

"${COMPOSE[@]}" ps --format json | grep -q '"Health":"healthy"'
"${COMPOSE[@]}" exec -T prod-app node -e "fetch('http://' + process.env.HOSTNAME + ':3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
"${COMPOSE[@]}" exec -T staging-app node -e "fetch('http://' + process.env.HOSTNAME + ':3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
