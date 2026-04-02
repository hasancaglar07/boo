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
  case "$BUILD_MODE" in
    never)
      return
      ;;
    always)
      echo "Next build calistiriliyor (BOOK_WEB_BUILD_MODE=always)..."
      run_pnpm build
      ;;
    auto)
      if [ ! -f "$WEB_DIR/.next/BUILD_ID" ]; then
        echo "Next build bulunamadi, build aliniyor..."
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
