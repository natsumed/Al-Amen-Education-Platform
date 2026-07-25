#!/bin/bash
# Manual/CI heartbeat: log network + last progress line (no long-running daemon)
LOG_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$LOG_DIR/progress.log"
ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1 && NET=ok || NET=fail
LAST=$(tail -1 "$LOG" 2>/dev/null || echo none)
AGE=unknown
if [[ -f "$LOG" ]]; then AGE=$(( $(date +%s) - $(stat -c %Y "$LOG") )); fi
echo "$(date -Iseconds) HEARTBEAT net=$NET log_age_s=$AGE last=$LAST" | tee -a "$LOG"
