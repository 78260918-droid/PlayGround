#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

project_dir="$(pwd)"
web_dir="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
: "${RUNTIME_DIR:?Set RUNTIME_DIR.}"
export PORT="${PORT:-3000}"

/usr/bin/time -p test -f "$project_dir/index.html"
/usr/bin/time -p mkdir -p "$web_dir"
/usr/bin/time -p node -e '
  const fs = require("node:fs");
  const [file, project, directory] = process.argv.slice(1);
  fs.writeFileSync(file, JSON.stringify({ project, directory }));
' "$web_dir/deployment-output.json" "$project_dir" "$project_dir"
/usr/bin/time -p node "$RUNTIME_DIR/scripts/default-start.mjs"
