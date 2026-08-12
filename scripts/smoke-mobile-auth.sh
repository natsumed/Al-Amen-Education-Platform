#!/usr/bin/env bash
# Smoke-test mobile login API (host side). Usage:
#   ./scripts/smoke-mobile-auth.sh
#   API_BASE=http://127.0.0.1:3000 ./scripts/smoke-mobile-auth.sh
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:3000}"
EMAIL="${SMOKE_EMAIL:-student@edutunisia.tn}"
PASS="${SMOKE_PASSWORD:-student123}"

echo "API_BASE=$API_BASE"

code="000"
code="$(curl -s -o /tmp/amenallah-smoke-root.body -w '%{http_code}' --connect-timeout 3 "$API_BASE/" )" || code="000"
echo "GET / → HTTP $code"
if [[ "$code" == "000" || -z "$code" ]]; then
  echo "FAIL: Next.js is not reachable. Start it with: npm run dev"
  exit 1
fi

resp="$(curl -s -X POST "$API_BASE/api/mobile/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  --connect-timeout 5 || true)"

echo "POST /api/mobile/auth/login → $resp" | head -c 500
echo

if echo "$resp" | grep -q '"token"'; then
  echo "OK: mobile login works"
  exit 0
fi

echo "FAIL: login did not return a token (seed DB? npm run db:seed)"
exit 1
