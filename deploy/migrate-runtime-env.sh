#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="${AMENALLAH_DEPLOY_DIR:-/opt/amenallah}"
ENV_FILE="$ROOT_DIR/runtime.env"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE" >&2; exit 1; }

ensure_var() {
  local key="$1" value="$2"
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

existing_tag="$(sed -n 's/^IMAGE_TAG=//p' "$ENV_FILE" | tail -n 1)"
[[ -n "$existing_tag" ]] || existing_tag="initial"

backup="$ENV_FILE.pre-security-$(date -u +%Y%m%dT%H%M%SZ)"
cp --preserve=mode,ownership,timestamps "$ENV_FILE" "$backup"

ensure_var PROD_IMAGE_TAG "$existing_tag"
ensure_var STAGING_IMAGE_TAG "$existing_tag"
ensure_var PROD_DATA_ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')"
ensure_var STAGING_DATA_ENCRYPTION_KEY "$(openssl rand -base64 32 | tr -d '\n')"
ensure_var PROD_AUDIT_HASH_KEY "$(openssl rand -base64 32 | tr -d '\n')"
ensure_var STAGING_AUDIT_HASH_KEY "$(openssl rand -base64 32 | tr -d '\n')"
ensure_var PROD_ALLOW_LEGACY_MEDIA true
ensure_var STAGING_ALLOW_LEGACY_MEDIA true
ensure_var PROD_MOBILE_NATIVE_CONTENT_ONLY false
ensure_var STAGING_MOBILE_NATIVE_CONTENT_ONLY false
ensure_var PROD_SECURE_CONTENT_ENABLED false
ensure_var STAGING_SECURE_CONTENT_ENABLED false
ensure_var VDOCIPHER_API_SECRET ""
ensure_var MOBILE_ATTESTATION_ENFORCED false
ensure_var OPENAI_API_KEY ""
ensure_var OPENAI_INGESTION_MODEL gpt-5-mini
ensure_var CLICTOPAY_ENABLED false
ensure_var CLICTOPAY_MERCHANT_ID ""
ensure_var CLICTOPAY_API_URL ""
ensure_var CLICTOPAY_API_SECRET ""

chmod 600 "$ENV_FILE"
install -d -m 750 /srv/amenallah/releases
echo "Runtime environment migrated; backup stored at $backup"
