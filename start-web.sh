#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$ROOT_DIR/web"

HOST="${BOOK_WEB_HOST:-127.0.0.1}"
PORT="${BOOK_WEB_PORT:-3000}"
HEALTH_URL="http://${HOST}:${PORT}"
PID_FILE="$ROOT_DIR/.web-server.pid"
LOG_FILE="$ROOT_DIR/.web-server.log"

DASHBOARD_HOST="${BOOK_DASHBOARD_HOST:-127.0.0.1}"
DASHBOARD_PORT="${BOOK_DASHBOARD_PORT:-8765}"
DASHBOARD_HEALTH_URL="http://${DASHBOARD_HOST}:${DASHBOARD_PORT}/api/health"

NODE_HOME="$ROOT_DIR/.tools/node-current"
NODE_BIN="$NODE_HOME/bin/node"
COREPACK_BIN="$NODE_HOME/bin/corepack"
NEXT_BIN="$WEB_DIR/node_modules/next/dist/bin/next"
BUILD_MODE="${BOOK_WEB_BUILD_MODE:-auto}"
REQUIRED_NODE_MAJOR="24"

dashboard_started_by_serve=0

node_path() {
  echo "$NODE_HOME/bin:$PATH"
}

run_pnpm() {
  (cd "$WEB_DIR" && env CI=true PATH="$(node_path)" "$COREPACK_BIN" pnpm "$@")
}

standalone_dir() {
  echo "$WEB_DIR/.next/standalone"
}

standalone_entrypoint() {
  echo "$(standalone_dir)/server.js"
}

build_marker() {
  echo "$WEB_DIR/.next/BUILD_ID"
}

next_lock_file() {
  echo "$WEB_DIR/.next/lock"
}

next_dev_lock_file() {
  echo "$WEB_DIR/.next/dev/lock"
}

find_repo_next_pid() {
  local mode="${1:-}"
  if [ -z "$mode" ]; then
    return 1
  fi

  ps -eo pid=,args= | awk -v mode="$mode" -v web_dir="$WEB_DIR" '
    {
      pid = $1
      $1 = ""
      sub(/^[[:space:]]+/, "", $0)
      args = $0
      if (index(args, web_dir) == 0) {
        next
      }
      if (index(args, "node_modules/next/dist/bin/next") == 0 && index(args, "node_modules/.bin/next") == 0) {
        next
      }
      pattern = "(^|[[:space:]])" mode "([[:space:]]|$)"
      if (args ~ pattern) {
        print pid
        exit
      }
    }
  '
}

clear_stale_next_lock() {
  local mode="${1:-}"
  local lock_file=""
  local active_pid=""

  case "$mode" in
    build)
      lock_file="$(next_lock_file)"
      active_pid="$(find_repo_next_pid build)"
      ;;
    dev)
      lock_file="$(next_dev_lock_file)"
      active_pid="$(find_repo_next_pid dev)"
      ;;
    *)
      echo "Bilinmeyen Next lock modu: $mode"
      exit 1
      ;;
  esac

  if [ ! -f "$lock_file" ]; then
    return
  fi

  if [ -n "$active_pid" ]; then
    return
  fi

  rm -f "$lock_file"
  echo "Stale Next $mode lock temizlendi: $lock_file"
}

prepare_next_locks() {
  clear_stale_next_lock build
  clear_stale_next_lock dev
}

is_healthy() {
  curl -fsS --max-time 2 "$HEALTH_URL" >/dev/null 2>&1
}

dashboard_is_healthy() {
  curl -fsS --max-time 2 "$DASHBOARD_HEALTH_URL" >/dev/null 2>&1
}

port_in_use() {
  python3 - "$HOST" "$PORT" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
sock = socket.socket()
sock.settimeout(1.0)
try:
    sock.connect((host, port))
except OSError:
    sys.exit(1)
else:
    sys.exit(0)
finally:
    sock.close()
PY
}

listener_pid_for_port() {
  ss -ltnp "sport = :$PORT" 2>/dev/null | awk 'match($0,/pid=([0-9]+)/,m){print m[1]; exit}'
}

is_repo_web_process() {
  local pid="${1:-}"
  if [ -z "$pid" ] || [ ! -d "/proc/$pid" ]; then
    return 1
  fi

  local cwd
  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
  if [ "$cwd" = "$WEB_DIR" ] || [ "$cwd" = "$(standalone_dir)" ]; then
    return 0
  fi

  local args
  args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  if [[ "$args" == *"$WEB_DIR"* ]] || [[ "$args" == *"next-server"* ]] || [[ "$args" == *"server.js"* ]]; then
    return 0
  fi

  return 1
}

recover_stale_server() {
  if [ -f "$PID_FILE" ] && port_in_use; then
    echo "Eski web sureci tespit edildi, kapatiliyor..."
    stop_server_core >/dev/null 2>&1 || true
    sleep 1
  fi
}

reset_foreground() {
  stop_server_core >/dev/null 2>&1 || true
  "$ROOT_DIR/start-dashboard.sh" stop >/dev/null 2>&1 || true
  serve_foreground
}

ensure_runtime() {
  if [ ! -x "$NODE_BIN" ]; then
    echo "Yerel Node runtime bulunamadi: $NODE_BIN"
    exit 1
  fi

  if [ ! -x "$COREPACK_BIN" ]; then
    echo "Corepack bulunamadi: $COREPACK_BIN"
    exit 1
  fi

  local node_version
  node_version="$(env PATH="$(node_path)" "$NODE_BIN" -p 'process.versions.node')"
  local node_major
  node_major="${node_version%%.*}"

  if [ "$node_major" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "Node surumu yetersiz: $node_version (gereken: >=$REQUIRED_NODE_MAJOR.x)"
    exit 1
  fi
}

verify_next_packages() {
  (
    cd "$WEB_DIR"
    env PATH="$(node_path)" "$NODE_BIN" -e "require.resolve('next/package.json'); require.resolve('next/dist/bin/next');" >/dev/null 2>&1
  )
}

ensure_dependencies() {
  if [ ! -d "$WEB_DIR/node_modules" ] || [ ! -f "$NEXT_BIN" ]; then
    echo "Web bagimliliklari kuruluyor..."
    run_pnpm install --frozen-lockfile --config.confirmModulesPurge=false
  fi

  if ! verify_next_packages; then
    echo "Next paketleri dogrulanamadi. Bagimliliklar onariliyor..."
    run_pnpm install --frozen-lockfile --config.confirmModulesPurge=false || run_pnpm install --force --config.confirmModulesPurge=false
  fi

  if ! verify_next_packages; then
    echo "Next paketleri hala bozuk. './start-web.sh repair' calistirin."
    exit 1
  fi
}

repair_dependencies() {
  ensure_runtime
  echo "Bagimliliklar sifirlaniyor..."
  rm -rf "$WEB_DIR/node_modules" "$WEB_DIR/.next"
  run_pnpm install --force --config.confirmModulesPurge=false

  if ! verify_next_packages; then
    echo "Bagimlilik onarimi basarisiz."
    exit 1
  fi

  echo "Bagimlilik onarimi tamamlandi."
}

ensure_build() {
  prepare_next_locks

  case "$BUILD_MODE" in
    never)
      return
      ;;
    always)
      echo "Next build calistiriliyor (BOOK_WEB_BUILD_MODE=always)..."
      run_pnpm build
      ;;
    auto)
      if [ ! -f "$(build_marker)" ]; then
        echo "Next build bulunamadi, build aliniyor..."
        run_pnpm build
      elif build_is_stale; then
        echo "Kaynak dosyalar build'den yeni, build aliniyor..."
        run_pnpm build
      fi
      ;;
    *)
      echo "Gecersiz BOOK_WEB_BUILD_MODE degeri: $BUILD_MODE"
      echo "Gecerli degerler: auto | always | never"
      exit 1
      ;;
  esac
}

build_is_stale() {
  local marker
  marker="$(build_marker)"

  if [ ! -f "$marker" ]; then
    return 0
  fi

  local path
  for path in \
    "$WEB_DIR/src" \
    "$WEB_DIR/public" \
    "$WEB_DIR/scripts"
  do
    if [ -d "$path" ] && find "$path" -type f -newer "$marker" -print -quit | grep -q .; then
      return 0
    fi
  done

  if [ -d "$WEB_DIR/prisma" ] && find "$WEB_DIR/prisma" -type f ! -name "dev.db" -newer "$marker" -print -quit | grep -q .; then
    return 0
  fi

  for path in \
    "$WEB_DIR/package.json" \
    "$WEB_DIR/pnpm-lock.yaml" \
    "$WEB_DIR/next.config.ts" \
    "$WEB_DIR/postcss.config.mjs" \
    "$WEB_DIR/components.json" \
    "$WEB_DIR/tsconfig.json" \
    "$ROOT_DIR/start-web.sh"
  do
    if [ -f "$path" ] && [ "$path" -nt "$marker" ]; then
      return 0
    fi
  done

  return 1
}

has_standalone_build() {
  [ -f "$(standalone_entrypoint)" ]
}

start_web_process_background() {
  if has_standalone_build; then
    if command -v setsid >/dev/null 2>&1; then
      setsid bash -lc "cd '$(standalone_dir)' && env PATH='$(node_path)' HOSTNAME='$HOST' PORT='$PORT' '$NODE_BIN' server.js" < /dev/null >"$LOG_FILE" 2>&1 &
    else
      nohup bash -lc "cd '$(standalone_dir)' && env PATH='$(node_path)' HOSTNAME='$HOST' PORT='$PORT' '$NODE_BIN' server.js" < /dev/null >"$LOG_FILE" 2>&1 &
      disown || true
    fi
    return
  fi

  if command -v setsid >/dev/null 2>&1; then
    setsid bash -lc "cd '$WEB_DIR' && env PATH='$(node_path)' '$NODE_BIN' '$NEXT_BIN' start --hostname '$HOST' --port '$PORT'" < /dev/null >"$LOG_FILE" 2>&1 &
  else
    nohup bash -lc "cd '$WEB_DIR' && env PATH='$(node_path)' '$NODE_BIN' '$NEXT_BIN' start --hostname '$HOST' --port '$PORT'" < /dev/null >"$LOG_FILE" 2>&1 &
    disown || true
  fi
}

serve_web_process_foreground() {
  if has_standalone_build; then
    cd "$(standalone_dir)"
    exec env PATH="$(node_path)" HOSTNAME="$HOST" PORT="$PORT" "$NODE_BIN" server.js
  fi

  cd "$WEB_DIR"
  exec env PATH="$(node_path)" "$NODE_BIN" "$NEXT_BIN" start --hostname "$HOST" --port "$PORT"
}

stop_server_core() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid"
      rm -f "$PID_FILE"
      echo "Web arayuz durduruldu."
      return 0
    fi
    rm -f "$PID_FILE"
  fi

  local pid
  pid="$(listener_pid_for_port)"
  if is_repo_web_process "$pid"; then
    kill "$pid"
    rm -f "$PID_FILE"
    echo "Web arayuz durduruldu."
    return 0
  fi

  echo "Takip edilen web sureci bulunamadi."
  return 1
}

stop_server() {
  stop_server_core || true
}

build_only() {
  ensure_runtime
  ensure_dependencies
  run_pnpm build
  echo "Build tamamlandi."
}

ensure_dashboard_running() {
  if dashboard_is_healthy; then
    return
  fi
  "$ROOT_DIR/start-dashboard.sh" start >/dev/null
}

start_server() {
  ensure_dashboard_running

  if is_healthy; then
    echo "Web arayuz zaten calisiyor: $HEALTH_URL"
    exit 0
  fi

  recover_stale_server

  if is_healthy; then
    echo "Web arayuz zaten calisiyor: $HEALTH_URL"
    exit 0
  fi

  if port_in_use; then
    echo "Port $PORT kullanimda fakat web arayuz saglik kontrolu cevap vermedi."
    echo "BOOK_WEB_PORT ile farkli port ver ya da portu bosalt."
    exit 1
  fi

  ensure_runtime
  ensure_dependencies
  ensure_build

  if [ ! -f "$NEXT_BIN" ]; then
    echo "Next CLI bulunamadi: $NEXT_BIN"
    exit 1
  fi

  start_web_process_background
  local pid
  pid=$!
  echo "$pid" > "$PID_FILE"

  for _ in $(seq 1 120); do
    if is_healthy; then
      echo "Web arayuz basladi: $HEALTH_URL"
      exit 0
    fi
    sleep 0.5
  done

  echo "Web arayuz baslamadi. Son log:"
  tail -n 60 "$LOG_FILE" 2>/dev/null || true
  exit 1
}

cleanup_serve() {
  if [ "$dashboard_started_by_serve" -eq 1 ]; then
    "$ROOT_DIR/start-dashboard.sh" stop >/dev/null 2>&1 || true
  fi
}

serve_foreground() {
  if is_healthy; then
    echo "Web arayuz zaten calisiyor: $HEALTH_URL"
    exit 0
  fi

  recover_stale_server

  if is_healthy; then
    echo "Web arayuz zaten calisiyor: $HEALTH_URL"
    exit 0
  fi

  if port_in_use; then
    echo "Port $PORT kullanimda fakat web arayuz saglik kontrolu cevap vermedi."
    echo "Calisan eski web surecini durdur ya da BOOK_WEB_PORT ile farkli bir port kullan."
    exit 1
  fi

  ensure_runtime
  ensure_dependencies
  ensure_build

  if ! dashboard_is_healthy; then
    "$ROOT_DIR/start-dashboard.sh" start >/dev/null
    dashboard_started_by_serve=1
  fi

  trap cleanup_serve EXIT INT TERM

  echo "Web arayuz foreground modda calisiyor: $HEALTH_URL"
  echo "Pencereyi kapatinca web sureci durur."

  serve_web_process_foreground
}

logs_tail() {
  if [ ! -f "$LOG_FILE" ]; then
    echo "Log dosyasi bulunamadi: $LOG_FILE"
    exit 1
  fi
  tail -n 120 "$LOG_FILE"
}

logs_live() {
  touch "$LOG_FILE" "$ROOT_DIR/.dashboard-server.log"
  echo "Canli log izleme acildi (yalnizca yeni satirlar). Cikis: Ctrl+C"
  if is_healthy; then
    echo "Web durumu: OK ($HEALTH_URL)"
  else
    echo "Web durumu: ERISILEMIYOR ($HEALTH_URL)"
  fi
  if dashboard_is_healthy; then
    echo "Dashboard durumu: OK ($DASHBOARD_HEALTH_URL)"
  else
    echo "Dashboard durumu: ERISILEMIYOR ($DASHBOARD_HEALTH_URL)"
  fi
  tail -n 0 -f "$LOG_FILE" "$ROOT_DIR/.dashboard-server.log"
}

logs_clear() {
  : > "$LOG_FILE"
  : > "$ROOT_DIR/.dashboard-server.log"
  echo "Web ve dashboard loglari temizlendi."
}

case "${1:-start}" in
  start|ensure)
    start_server
    ;;
  serve|foreground)
    serve_foreground
    ;;
  reset)
    reset_foreground
    ;;
  build)
    build_only
    ;;
  repair)
    repair_dependencies
    ;;
  logs)
    logs_tail
    ;;
  logs-live)
    logs_live
    ;;
  logs-clear)
    logs_clear
    ;;
  stop)
    stop_server
    ;;
  restart)
    stop_server_core || true
    start_server
    ;;
  *)
    echo "Usage: $0 [start|ensure|serve|foreground|reset|build|repair|logs|logs-live|logs-clear|stop|restart]"
    exit 1
    ;;
esac
