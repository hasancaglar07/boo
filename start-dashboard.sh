#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./book-generator-env.sh
source "$ROOT_DIR/book-generator-env.sh"

HOST="${BOOK_DASHBOARD_HOST:-127.0.0.1}"
PORT="${BOOK_DASHBOARD_PORT:-8765}"
HEALTH_URL="http://${HOST}:${PORT}/api/health"
PID_FILE="$ROOT_DIR/.dashboard-server.pid"
LOG_FILE="$ROOT_DIR/.dashboard-server.log"

is_healthy() {
    curl -fsS --max-time 2 "$HEALTH_URL" >/dev/null 2>&1
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

stop_server() {
    if [ -f "$PID_FILE" ]; then
        pid="$(cat "$PID_FILE")"
        if kill -0 "$pid" >/dev/null 2>&1; then
            kill "$pid"
            rm -f "$PID_FILE"
            echo "Dashboard stopped."
            exit 0
        fi
    fi
    echo "No tracked dashboard process found."
}

serve_foreground() {
    exec python3 "$ROOT_DIR/dashboard_server.py"
}

start_server() {
    if is_healthy; then
        echo "Dashboard already running at $HEALTH_URL"
        exit 0
    fi

    if port_in_use; then
        echo "Port $PORT is already in use, but the dashboard health endpoint did not respond."
        echo "Check what is using the port or set BOOK_DASHBOARD_PORT to a free port."
        exit 1
    fi

    if command -v setsid >/dev/null 2>&1; then
        setsid python3 "$ROOT_DIR/dashboard_server.py" < /dev/null >"$LOG_FILE" 2>&1 &
    else
        nohup python3 "$ROOT_DIR/dashboard_server.py" < /dev/null >"$LOG_FILE" 2>&1 &
        disown || true
    fi
    pid=$!
    echo "$pid" > "$PID_FILE"

    for _ in $(seq 1 40); do
        if is_healthy; then
            echo "Dashboard started at $HEALTH_URL"
            exit 0
        fi
        sleep 0.25
    done

    echo "Dashboard failed to start. Last log output:"
    tail -n 40 "$LOG_FILE" 2>/dev/null || true
    exit 1
}

case "${1:-start}" in
    start|ensure)
        start_server
        ;;
    serve)
        serve_foreground
        ;;
    stop)
        stop_server
        ;;
    *)
        echo "Usage: $0 [start|ensure|serve|stop]"
        exit 1
        ;;
esac
