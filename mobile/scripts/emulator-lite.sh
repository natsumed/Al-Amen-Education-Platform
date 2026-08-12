#!/usr/bin/env bash
# Low-resource Android emulator for Amenallah smoke tests
set -euo pipefail
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
AVD_NAME="${1:-Amenallah_API34}"
exec emulator -avd "$AVD_NAME" \
  -memory 1536 \
  -cores 2 \
  -gpu swiftshader_indirect \
  -no-audio \
  -no-boot-anim \
  -no-snapshot \
  -no-metrics \
  -accel on \
  -netdelay none \
  -netspeed full
