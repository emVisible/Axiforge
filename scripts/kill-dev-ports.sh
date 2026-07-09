#!/usr/bin/env bash
# 释放 Axiforge 开发常用端口（5174–5176、5274–5276、8000）
set -euo pipefail

PORTS=(8000 5174 5175 5176 5274 5275 5276)

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "释放端口 $port (PID: $pids)"
    kill $pids 2>/dev/null || true
  fi
done

echo "完成。可重新运行 pnpm dev"
