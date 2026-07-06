#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/backend/.env"
ENV_EXAMPLE="$ROOT/backend/.env.example"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created backend/.env from .env.example"
fi

DB_NAME=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed -E 's|.*/([^/?]+)(\?.*)?$|\1|' || echo "axiforge")

using_docker=false
if command -v docker >/dev/null 2>&1; then
  if docker compose -f "$ROOT/docker-compose.yml" ps --status running postgres 2>/dev/null | grep -q postgres; then
    using_docker=true
    echo "Detected Docker PostgreSQL (axiforge-postgres)"
  fi
fi

if [[ "$using_docker" == "false" ]]; then
  if createdb "$DB_NAME" 2>/dev/null; then
    echo "Created database: $DB_NAME"
  elif psql -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
    echo "Database already exists: $DB_NAME"
  else
    echo "Failed to create database: $DB_NAME"
    echo "Ensure PostgreSQL is running, or start Docker DB with: pnpm db:up"
    exit 1
  fi
else
  echo "Using existing Docker database: $DB_NAME"
fi

cd "$ROOT/backend"
uv run alembic upgrade head
echo "Alembic migrations applied."
