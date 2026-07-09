#!/usr/bin/env bash
# 基于 tmux：每个 Axiforge 应用在独立 session 中运行。
# 用法: ./dev.bash          启动全部并 attach 到 web session
#       ./dev.bash stop     停止全部 axiforge-* session
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN="$ROOT/scripts/run-dev.sh"

if ! command -v tmux >/dev/null 2>&1; then
  echo "需要安装 tmux（macOS: brew install tmux）" >&2
  exit 1
fi

SESSIONS=(axiforge-api axiforge-web axiforge-admin axiforge-nexus)
SERVICES=(api web admin nexus)

stop_sessions() {
  for s in "${SESSIONS[@]}"; do
    tmux has-session -t "$s" 2>/dev/null && tmux kill-session -t "$s"
  done
  echo "已停止全部 axiforge tmux session。"
}

if [[ "${1:-}" == "stop" ]]; then
  stop_sessions
  exit 0
fi

stop_sessions

for i in "${!SERVICES[@]}"; do
  svc="${SERVICES[$i]}"
  sess="${SESSIONS[$i]}"
  tmux new-session -d -s "$sess" -c "$ROOT"
  tmux send-keys -t "$sess" "bash \"$RUN\" $svc" C-m
done

cd "$ROOT"

eval "$(
  node --input-type=module -e "
    import { PORTS, origins } from './scripts/ports.mjs';
    console.log('echo \"\"');
    console.log('echo \"Axiforge 开发环境（tmux）\"');
    console.log('echo \"  API:   ' + origins.api + '  →  tmux attach -t axiforge-api\"');
    console.log('echo \"  Web:   ' + origins.web + '  →  tmux attach -t axiforge-web\"');
    console.log('echo \"  Admin: ' + origins.admin + '  →  tmux attach -t axiforge-admin\"');
    console.log('echo \"  Nexus: ' + origins.nexus + '  →  tmux attach -t axiforge-nexus\"');
    console.log('echo \"  停止: ./dev.bash stop\"');
    console.log('echo \"\"');
  "
)"

tmux attach -t axiforge-web
