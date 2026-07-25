#!/usr/bin/env bash
# LAN mode — phone and PC on same Wi‑Fi (no AP isolation).
set -euo pipefail
cd "$(dirname "$0")/.."

detect_ip() {
  # Prefer default-route interface (real LAN), skip docker/vpn/loopback
  local ip
  ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}' || true)"
  if [[ -n "${ip:-}" && "$ip" != "127.0.0.1" && "$ip" != 1.* ]]; then
    echo "$ip"
    return
  fi
  ip -4 -o addr show scope global 2>/dev/null \
    | awk '!/docker|br-|veth|virbr|tun|tap|wg/ {print $4}' \
    | cut -d/ -f1 \
    | head -1
}

LAN_IP="$(detect_ip || true)"
if [[ -z "${LAN_IP:-}" ]]; then
  echo "No usable LAN IP found (Wi‑Fi/Ethernet may be down)."
  echo "Use USB instead:  npm run start:usb"
  exit 1
fi

export REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP"
export EXPO_PUBLIC_API_URL="http://${LAN_IP}:3000"

echo "LAN IP: $LAN_IP"
echo "Metro:  exp://${LAN_IP}:8081"
echo "API:    $EXPO_PUBLIC_API_URL"
echo "Phone + PC must be on the same Wi‑Fi. If it fails → npm run start:usb"
echo ""

exec npx expo start --lan --clear "$@"
