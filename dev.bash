#!/usr/bin/env bash
# 基于 tmux：默认只运行桌面产品；旧多服务栈需显式选择。
# 用法: ./dev.bash          启动桌面应用并 attach 到桌面 session
#       ./dev.bash all      启动 API + Web + Admin + Nexus
#       ./dev.bash stop     停止全部 axiforge-* session
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN="$ROOT/scripts/run-dev.sh"

if ! command -v tmux >/dev/null 2>&1; then
  echo "需要安装 tmux（macOS: brew install tmux）" >&2
  exit 1
fi

SESSIONS=(axiforge-desktop axiforge-api axiforge-web axiforge-admin axiforge-nexus)

stop_sessions() {
  for s in "${SESSIONS[@]}"; do
    tmux has-session -t "$s" 2>/dev/null && tmux kill-session -t "$s"
  done
  echo "已停止全部 axiforge tmux session。"
}

MODE="${1:-desktop}"
case "$MODE" in
  stop)
    stop_sessions
    exit 0
    ;;
  desktop|all) ;;
  *)
    echo "用法: ./dev.bash [desktop | all | stop]" >&2
    exit 2
    ;;
esac

stop_sessions

if [[ "$MODE" == "desktop" ]]; then
  tmux new-session -d -s axiforge-desktop -c "$ROOT"
  tmux send-keys -t axiforge-desktop "pnpm dev:desktop" C-m
  echo "Axiforge 桌面开发环境，连接: tmux attach -t axiforge-desktop"
  echo "停止: ./dev.bash stop"
  tmux attach -t axiforge-desktop
  exit 0
fi

SERVICES=(api web admin nexus)
STACK_SESSIONS=(axiforge-api axiforge-web axiforge-admin axiforge-nexus)
for i in "${!SERVICES[@]}"; do
  svc="${SERVICES[$i]}"
  sess="${STACK_SESSIONS[$i]}"
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
