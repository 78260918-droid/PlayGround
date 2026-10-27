#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

: "${RUNTIME_DIR:?Set RUNTIME_DIR.}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to a directory outside the project.}"

capture_path="$(/usr/bin/time -p realpath -m "$CAPTURE_DIR")"
project_path="$(/usr/bin/time -p realpath -m "$(pwd)")"
case "$capture_path/" in
  "$project_path/"*) echo "CAPTURE_DIR must be outside the project source tree." >&2; exit 1 ;;
esac

/usr/bin/time -p mkdir -p "$capture_path"
export CAPTURE_URL
export CAPTURE_DIR="$capture_path"
export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-canvas}"

/usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"
