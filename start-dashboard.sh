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
FORCE_RESTART="${BOOK_DASHBOARD_FORCE_RESTART:-0}"

dashboard_force_restart_enabled() {
    case "${FORCE_RESTART,,}" in
        1|true|yes|on)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

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

listener_pid_for_port() {
    ss -ltnp "sport = :$PORT" 2>/dev/null | awk 'match($0,/pid=([0-9]+)/,m){print m[1]; exit}'
}

pid_is_running() {
    local pid="${1:-}"
    [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1
}

remove_stale_pid_file() {
    if [ ! -f "$PID_FILE" ]; then
        return
    fi
    local pid
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if ! pid_is_running "$pid"; then
        rm -f "$PID_FILE"
    fi
}

kill_pid_gracefully() {
    local pid="${1:-}"
    if ! pid_is_running "$pid"; then
        return 1
    fi
    kill "$pid" >/dev/null 2>&1 || true
    for _ in $(seq 1 20); do
        if ! pid_is_running "$pid"; then
            return 0
        fi
        sleep 0.1
    done
    kill -9 "$pid" >/dev/null 2>&1 || true
    ! pid_is_running "$pid"
}

kill_listener_if_dashboard() {
    local pid args
    pid="$(listener_pid_for_port || true)"
    if [ -z "$pid" ]; then
        return 1
    fi
    args="$(ps -p "$pid" -o args= 2>/dev/null || true)"
    if [[ "$args" != *"dashboard_server.py"* ]]; then
        return 1
    fi
    kill_pid_gracefully "$pid"
}

stop_server() {
    remove_stale_pid_file
    local stopped=0

    if [ -f "$PID_FILE" ]; then
        local pid
        pid="$(cat "$PID_FILE" 2>/dev/null || true)"
        if kill_pid_gracefully "$pid"; then
            stopped=1
        fi
        rm -f "$PID_FILE"
    fi

    if kill_listener_if_dashboard; then
        stopped=1
    fi

    if [ "$stopped" -eq 1 ]; then
        echo "Dashboard stopped."
    else
        echo "No tracked dashboard process found."
    fi
}

serve_foreground() {
    exec python3 "$ROOT_DIR/dashboard_server.py"
}

start_server() {
    remove_stale_pid_file

    if dashboard_force_restart_enabled; then
        stop_server >/dev/null 2>&1 || true
    fi

    if is_healthy; then
        echo "Dashboard already running at $HEALTH_URL"
        exit 0
    fi

    if port_in_use; then
        if dashboard_force_restart_enabled && kill_listener_if_dashboard; then
            sleep 0.3
        fi
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
    local pid=$!
    echo "$pid" > "$PID_FILE"

    for _ in $(seq 1 40); do
        if is_healthy; then
            echo "Dashboard started at $HEALTH_URL"
            exit 0
        fi
        sleep 0.25
    done

    if pid_is_running "$pid"; then
        kill_pid_gracefully "$pid" >/dev/null 2>&1 || true
    fi
    rm -f "$PID_FILE"
    echo "Dashboard failed to start. Last log output:"
    tail -n 40 "$LOG_FILE" 2>/dev/null || true
    exit 1
}

case "${1:-start}" in
    start|ensure)
        start_server
        ;;
    restart)
        stop_server >/dev/null 2>&1 || true
        start_server
        ;;
    serve)
        serve_foreground
        ;;
    stop)
        stop_server
        ;;
    *)
        echo "Usage: $0 [start|ensure|restart|serve|stop]"
        exit 1
        ;;
esac
