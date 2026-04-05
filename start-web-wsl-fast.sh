#!/bin/bash
set -euo pipefail

SOURCE_REPO="${1:-}"
MODE="${2:-dev}"

if [ -z "$SOURCE_REPO" ]; then
  echo "Kullanim: $0 <source_repo_wsl_path> [dev|start|prod|reset|stop|logs|logs-live|build|repair]"
  exit 1
fi

TARGET_BASE="${BOOK_FAST_BASE:-$HOME/.book-fast}"
TARGET_REPO="$TARGET_BASE/BOOK"
SYNC_STAMP="$TARGET_BASE/.last-sync"

mkdir -p "$TARGET_BASE"

sync_repo() {
  echo "[fast] WSL hizli kopya hazirlaniyor..."
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude '.git/' \
      --exclude '.next/' \
      --exclude '.tools/' \
      --exclude '.web-server.pid' \
      --exclude '.web-server.log' \
      --exclude '.dashboard-server.pid' \
      --exclude '.dashboard-server.log' \
      --exclude 'web/node_modules/' \
      --exclude 'web/.next/' \
      "$SOURCE_REPO/" "$TARGET_REPO/"
  else
    rm -rf "$TARGET_REPO"
    mkdir -p "$TARGET_REPO"
    tar -C "$SOURCE_REPO" \
      --exclude='.git' \
      --exclude='.next' \
      --exclude='.tools' \
      --exclude='.web-server.pid' \
      --exclude='.web-server.log' \
      --exclude='.dashboard-server.pid' \
      --exclude='.dashboard-server.log' \
      --exclude='web/node_modules' \
      --exclude='web/.next' \
      -cf - . | tar -C "$TARGET_REPO" -xf -
  fi
  date -Iseconds > "$SYNC_STAMP"
}

ensure_target() {
  sync_repo
  if [ ! -d "$TARGET_REPO/web/node_modules" ]; then
    echo "[fast] Ilk kurulum: WSL kopyasi icin bagimliliklar hazirlaniyor..."
  fi
}

ensure_target

export BOOK_NODE_HOME="${BOOK_NODE_HOME:-$SOURCE_REPO/.tools/node-current}"

cd "$TARGET_REPO"
echo "[fast] Kaynak: $SOURCE_REPO"
echo "[fast] Calisma kopyasi: $TARGET_REPO"
echo "[fast] Mod: $MODE"
exec ./start-web.sh "$MODE"
