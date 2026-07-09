#!/usr/bin/env bash
# 加载 scripts/ports.mjs 中的端口，启动单个或全部开发服务。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

eval "$(
  node --input-type=module -e "
    import { PORTS, origins } from './scripts/ports.mjs';
    for (const [k, v] of Object.entries(PORTS)) {
      console.log('export AXIFORGE_' + k.toUpperCase() + '_PORT=' + v);
    }
    for (const [k, v] of Object.entries(origins)) {
      console.log('export AXIFORGE_' + k.toUpperCase() + '_ORIGIN=' + v);
    }
    console.log('export VITE_API_URL=' + origins.api + '/api/v1');
    console.log('export VITE_WEB_ORIGIN=' + origins.web);
    console.log('export NEXUS_DEV_PORT=' + PORTS.nexus);
  "
)"

run_one() {
  case "$1" in
    api)
      cd "$ROOT/backend"
      exec uv run uvicorn app.main:app --reload --host 0.0.0.0 --port "$AXIFORGE_API_PORT"
      ;;
    web)
      exec pnpm --filter @axiforge/web dev
      ;;
    admin)
      exec pnpm --filter @axiforge/admin dev
      ;;
    nexus)
      exec pnpm --filter @axiforge/nexus dev
      ;;
    *)
      echo "未知服务: $1（api | web | admin | nexus）" >&2
      exit 1
      ;;
  esac
}

if [[ "${1:-all}" == "all" ]]; then
  exec pnpm exec concurrently \
    -n "api,web,admin,nexus" \
    -c "magenta,cyan,yellow,green" \
    "bash scripts/run-dev.sh api" \
    "bash scripts/run-dev.sh web" \
    "bash scripts/run-dev.sh admin" \
    "bash scripts/run-dev.sh nexus"
fi

run_one "$1"
