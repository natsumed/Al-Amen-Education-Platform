#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
COMPOSE=(docker compose --env-file "$ROOT_DIR/runtime.env" -f "$ROOT_DIR/docker-compose.yml")
TARGET="${1:?Usage: deploy.sh <staging|production> <immutable-image-tag>}"
IMAGE_TAG_INPUT="${2:?Usage: deploy.sh <staging|production> <immutable-image-tag>}"

if [[ ! "$IMAGE_TAG_INPUT" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]]; then
  echo "Invalid image tag" >&2
  exit 2
fi

read_env_value() {
  local key="$1"
  sed -n "s/^${key}=//p" "$ROOT_DIR/runtime.env" | tail -n 1
}

persist_env_value() {
  local key="$1" value="$2" temporary
  temporary="$(mktemp "$ROOT_DIR/runtime.env.XXXXXX")"
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    index($0, key "=") == 1 { print key "=" value; found = 1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$ROOT_DIR/runtime.env" > "$temporary"
  chmod --reference="$ROOT_DIR/runtime.env" "$temporary"
  chown --reference="$ROOT_DIR/runtime.env" "$temporary"
  mv "$temporary" "$ROOT_DIR/runtime.env"
}

cd "$ROOT_DIR"
case "$TARGET" in
  staging)
    previous_tag="$(read_env_value STAGING_IMAGE_TAG)"
    export STAGING_IMAGE_TAG="$IMAGE_TAG_INPUT"
    export PROD_IMAGE_TAG="$(read_env_value PROD_IMAGE_TAG)"
    services=(staging-db staging-valkey staging-app)
    app_service=staging-app
    tag_key=STAGING_IMAGE_TAG
    ;;
  production)
    previous_tag="$(read_env_value PROD_IMAGE_TAG)"
    export PROD_IMAGE_TAG="$IMAGE_TAG_INPUT"
    export STAGING_IMAGE_TAG="$(read_env_value STAGING_IMAGE_TAG)"
    services=(prod-db prod-valkey prod-app caddy)
    app_service=prod-app
    tag_key=PROD_IMAGE_TAG
    ;;
  *)
    echo "Unknown deployment target: $TARGET" >&2
    exit 2
    ;;
esac

if [[ -z "$previous_tag" || -z "$PROD_IMAGE_TAG" || -z "$STAGING_IMAGE_TAG" ]]; then
  echo "Both production and staging image tags must exist in runtime.env" >&2
  exit 2
fi

rollback() {
  echo "Health check failed; restoring $TARGET image $previous_tag" >&2
  if [[ "$TARGET" == "production" ]]; then
    export PROD_IMAGE_TAG="$previous_tag"
  else
    export STAGING_IMAGE_TAG="$previous_tag"
  fi
  "${COMPOSE[@]}" up -d "$app_service"
}

"${COMPOSE[@]}" pull "$app_service"
"${COMPOSE[@]}" run --rm "$app_service" npx prisma migrate deploy
"${COMPOSE[@]}" up -d "${services[@]}"
"${COMPOSE[@]}" ps "$app_service"

for service in "$app_service"; do
  for attempt in {1..20}; do
    if "${COMPOSE[@]}" exec -T "$service" node -e "fetch('http://' + process.env.HOSTNAME + ':3000/api/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; then
      break
    fi
    if [[ "$attempt" == 20 ]]; then
      rollback
      exit 1
    fi
    sleep 3
  done
done

persist_env_value "$tag_key" "$IMAGE_TAG_INPUT"
echo "Deployed $TARGET image $IMAGE_TAG_INPUT"
