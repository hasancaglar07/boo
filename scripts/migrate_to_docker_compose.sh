#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_ENV_FILE="${BOOK_COMPOSE_ENV_FILE:-$ROOT_DIR/.env.compose}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_ENV_FILE" ]; then
  echo "compose env file not found: $COMPOSE_ENV_FILE" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/runtime/sqlite" "$ROOT_DIR/book_outputs" "$ROOT_DIR/multi_provider_logs"

if [ -f /var/lib/book-generator/prod.db ] && [ ! -f "$ROOT_DIR/runtime/sqlite/prod.db" ]; then
  cp /var/lib/book-generator/prod.db "$ROOT_DIR/runtime/sqlite/prod.db"
fi

if [ ! -f "$ROOT_DIR/dashboard_settings.json" ]; then
  touch "$ROOT_DIR/dashboard_settings.json"
fi

docker compose --env-file "$COMPOSE_ENV_FILE" build
docker compose --env-file "$COMPOSE_ENV_FILE" --profile ops run --rm web-migrate

if systemctl list-unit-files | grep -q '^book-web.service'; then
  systemctl stop book-web || true
fi

if systemctl list-unit-files | grep -q '^book-dashboard.service'; then
  systemctl stop book-dashboard || true
fi

docker compose --env-file "$COMPOSE_ENV_FILE" up -d dashboard web
docker compose --env-file "$COMPOSE_ENV_FILE" ps
