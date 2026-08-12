#!/usr/bin/env bash
# One-shot: start Next.js for mobile (emulator + LAN phone).
# Emulator API URL: http://10.0.2.2:3000
# Phone API URL:    http://<this-pc-lan-ip>:3000  (long-press logo on Login to set it)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

detect_ip() {
  local ip
  ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}' || true)"
  if [[ -n "${ip:-}" && "$ip" != "127.0.0.1" ]]; then
    echo "$ip"
    return
  fi
  ip -4 -o addr show scope global 2>/dev/null \
    | awk '!/docker|br-|veth|virbr|tun|tap|wg/ {print $4}' \
    | cut -d/ -f1 \
    | head -1
}

LAN_IP="$(detect_ip || true)"
echo "============================================"
echo " Amenallah API for Android"
echo "============================================"
echo " Emulator → http://10.0.2.2:3000"
if [[ -n "${LAN_IP:-}" ]]; then
  echo " Phone    → http://${LAN_IP}:3000"
else
  echo " Phone    → (no LAN IP — use USB: adb reverse tcp:3000 tcp:3000 + http://127.0.0.1:3000)"
fi
echo " Listening on 0.0.0.0:3000"
echo "============================================"
echo ""
echo "Test accounts:"
echo "  student@edutunisia.tn / student123"
echo ""

exec npm run dev
