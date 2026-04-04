#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_ENV_FILE="${BOOK_COMPOSE_ENV_FILE:-$ROOT_DIR/.env.compose}"
SKIP_PULL=0
GIT_REF="${DEPLOY_GIT_REF:-}"

usage() {
  cat <<'EOF'
Usage: deploy_update.sh [--skip-pull] [--ref <git-ref>]

Options:
  --skip-pull   Skip git pull and deploy the current checkout as-is.
  --ref <ref>   Pull a specific git ref with --ff-only.

Environment:
  BOOK_COMPOSE_ENV_FILE   Path to the compose env file. Defaults to .env.compose in repo root.
  DEPLOY_GIT_REF          Default git ref to pull when --ref is not provided.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-pull)
      SKIP_PULL=1
      shift
      ;;
    --ref)
      if [ "$#" -lt 2 ]; then
        echo "--ref requires a value" >&2
        exit 1
      fi
      GIT_REF="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [ ! -f "$COMPOSE_ENV_FILE" ]; then
  echo "compose env file not found: $COMPOSE_ENV_FILE" >&2
  exit 1
fi

if docker info >/dev/null 2>&1; then
  DOCKER_PREFIX=()
else
  DOCKER_PREFIX=(sudo)
fi

compose() {
  "${DOCKER_PREFIX[@]}" docker compose --env-file "$COMPOSE_ENV_FILE" "$@"
}

docker_cmd() {
  "${DOCKER_PREFIX[@]}" docker "$@"
}

health_check() {
  local label="$1"
  local url="$2"
  local attempts="$3"
  local delay="$4"
  local tmp_file

  tmp_file="$(mktemp)"
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >"$tmp_file"; then
      echo "[$label] ok: $(cat "$tmp_file")"
      rm -f "$tmp_file"
      return 0
    fi
    sleep "$delay"
  done

  echo "[$label] failed: $url" >&2
  rm -f "$tmp_file"
  return 1
}

asset_check_in_container() {
  local base_url="$1"
  local iterations="$2"
  local mode_label="$3"

  echo "[asset-check:$mode_label] base=$base_url iterations=$iterations"
  compose exec -T web env \
    CHECK_BASE_URL="$base_url" \
    CHECK_ITERATIONS="$iterations" \
    node ./scripts/check-asset-consistency.mjs
}

ensure_clean_git_tree() {
  if ! git -C "$ROOT_DIR" diff --quiet || ! git -C "$ROOT_DIR" diff --cached --quiet; then
    echo "working tree has tracked changes; commit/stash them or rerun with --skip-pull" >&2
    exit 1
  fi

  if [ -n "$(git -C "$ROOT_DIR" ls-files --others --exclude-standard)" ]; then
    echo "working tree has untracked files; commit/stash them or rerun with --skip-pull" >&2
    exit 1
  fi
}

backup_image_if_present() {
  local image="$1"
  if docker_cmd image inspect "$image:latest" >/dev/null 2>&1; then
    docker_cmd image tag "$image:latest" "$image:backup"
  fi
}

restore_backup_if_present() {
  local image="$1"
  if docker_cmd image inspect "$image:backup" >/dev/null 2>&1; then
    docker_cmd image tag "$image:backup" "$image:latest"
  fi
}

rollback() {
  echo "[rollback] restoring previous images" >&2
  restore_backup_if_present "book-generator-dashboard"
  restore_backup_if_present "book-generator-web"
  compose up -d dashboard web >/dev/null 2>&1 || true
}

set -a
# shellcheck disable=SC1090
source "$COMPOSE_ENV_FILE"
set +a

BOOK_WEB_BIND_PORT="${BOOK_WEB_BIND_PORT:-3000}"
BOOK_DASHBOARD_BIND_PORT="${BOOK_DASHBOARD_BIND_PORT:-8765}"
DEPLOY_LOCAL_ASSET_CHECK_ITERATIONS="${DEPLOY_LOCAL_ASSET_CHECK_ITERATIONS:-3}"
DEPLOY_PUBLIC_ASSET_CHECK_ITERATIONS="${DEPLOY_PUBLIC_ASSET_CHECK_ITERATIONS:-6}"
DEPLOY_PUBLIC_BASE_URL="${DEPLOY_PUBLIC_BASE_URL:-https://bookgenerator.net}"
DEPLOY_SKIP_PUBLIC_ASSET_CHECK="${DEPLOY_SKIP_PUBLIC_ASSET_CHECK:-0}"

if [ "$SKIP_PULL" -eq 0 ]; then
  ensure_clean_git_tree
  if [ -n "$GIT_REF" ]; then
    git -C "$ROOT_DIR" pull --ff-only origin "$GIT_REF"
  else
    git -C "$ROOT_DIR" pull --ff-only
  fi
fi

backup_image_if_present "book-generator-dashboard"
backup_image_if_present "book-generator-web"

compose build
compose --profile ops run --rm web-migrate

if ! compose up -d dashboard web; then
  rollback
  echo "compose up failed; previous images restored" >&2
  exit 1
fi

if ! health_check "dashboard" "http://127.0.0.1:${BOOK_DASHBOARD_BIND_PORT}/api/health" 40 1; then
  rollback
  exit 1
fi

if ! health_check "web" "http://127.0.0.1:${BOOK_WEB_BIND_PORT}/api/auth/state" 60 1; then
  rollback
  exit 1
fi

if ! asset_check_in_container "http://127.0.0.1:${BOOK_WEB_BIND_PORT}" "$DEPLOY_LOCAL_ASSET_CHECK_ITERATIONS" "local"; then
  rollback
  exit 1
fi

if [ "$DEPLOY_SKIP_PUBLIC_ASSET_CHECK" != "1" ] && [ -n "$DEPLOY_PUBLIC_BASE_URL" ]; then
  if ! asset_check_in_container "$DEPLOY_PUBLIC_BASE_URL" "$DEPLOY_PUBLIC_ASSET_CHECK_ITERATIONS" "public"; then
    echo "[asset-check:public] failed. Mixed releases/origins may be active behind CDN or DNS." >&2
    echo "[asset-check:public] check Cloudflare DNS (single active origin), old containers, and CDN cache purge." >&2
    exit 1
  fi
fi

compose ps
