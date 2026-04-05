#!/usr/bin/env bash

CODEFAST_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd)"
CODEFAST_PROJECT_ROOT="$(cd "$CODEFAST_LIB_DIR/.." && pwd)"
CODEFAST_LOG_DIR="${CODEFAST_LOG_DIR:-$CODEFAST_PROJECT_ROOT/multi_provider_logs}"
CODEFAST_STATE_DIR="${CODEFAST_STATE_DIR:-$CODEFAST_LOG_DIR/codefast_state}"
CODEFAST_USAGE_DIR="$CODEFAST_STATE_DIR/usage"
CODEFAST_EXHAUSTED_DIR="$CODEFAST_STATE_DIR/exhausted"

mkdir -p "$CODEFAST_LOG_DIR" "$CODEFAST_USAGE_DIR" "$CODEFAST_EXHAUSTED_DIR"

codefast_today() {
    date +%Y-%m-%d
}

resolve_codefast_api_key() {
    local value=""
    for value in \
        "${CODEFAST_API_KEY:-}" \
        "${codefast:-}"
    do
        if [ -n "$value" ]; then
            printf '%s\n' "$value"
            return 0
        fi
    done
    return 1
}

codefast_has_api_key() {
    [ -n "$(resolve_codefast_api_key 2>/dev/null || true)" ]
}

normalize_base_url() {
    local url="$1"
    url="${url%/}"
    printf '%s\n' "$url"
}

codefast_provider_label() {
    case "$1" in
        glm-main) echo "GLM Codefast" ;;
        *) echo "$1" ;;
    esac
}

codefast_provider_daily_limit() {
    case "$1" in
        glm-main) echo 1000 ;;
        *) echo 0 ;;
    esac
}

codefast_provider_usage_file() {
    printf '%s/%s--%s.count\n' "$CODEFAST_USAGE_DIR" "$(codefast_today)" "$1"
}

codefast_provider_exhausted_file() {
    printf '%s/%s--%s.reason\n' "$CODEFAST_EXHAUSTED_DIR" "$(codefast_today)" "$1"
}

codefast_provider_usage_count() {
    local file
    file="$(codefast_provider_usage_file "$1")"
    if [ -f "$file" ]; then
        cat "$file"
    else
        echo 0
    fi
}

codefast_increment_provider_usage() {
    local provider_id="$1"
    local current
    current="$(codefast_provider_usage_count "$provider_id")"
    printf '%s\n' "$((current + 1))" > "$(codefast_provider_usage_file "$provider_id")"
}

codefast_mark_provider_exhausted() {
    local provider_id="$1"
    local reason="${2:-limit_reached}"
    printf '%s\n' "$reason" > "$(codefast_provider_exhausted_file "$provider_id")"
}

codefast_provider_exhausted_reason() {
    local file
    file="$(codefast_provider_exhausted_file "$1")"
    if [ -f "$file" ]; then
        cat "$file"
    else
        echo ""
    fi
}

codefast_provider_is_exhausted() {
    local provider_id="$1"
    local limit
    local current
    limit="$(codefast_provider_daily_limit "$provider_id")"
    current="$(codefast_provider_usage_count "$provider_id")"

    if [ "$limit" -gt 0 ] && [ "$current" -ge "$limit" ]; then
        return 0
    fi

    [ -f "$(codefast_provider_exhausted_file "$provider_id")" ]
}

codefast_provider_remaining() {
    local provider_id="$1"
    local limit
    local current
    limit="$(codefast_provider_daily_limit "$provider_id")"
    current="$(codefast_provider_usage_count "$provider_id")"

    if [ "$limit" -le 0 ]; then
        echo 0
        return 0
    fi

    if [ "$current" -ge "$limit" ]; then
        echo 0
    else
        echo "$((limit - current))"
    fi
}

codefast_text_provider_ids() {
    printf '%s\n' "glm-main"
}

codefast_text_provider_order() {
    if [ -n "${CODEFAST_TEXT_PROVIDER_ORDER:-}" ]; then
        printf '%s\n' "$CODEFAST_TEXT_PROVIDER_ORDER"
        return 0
    fi

    printf '%s\n' "glm-main"
}

codefast_text_provider_base_url() {
    case "$1" in
        glm-main) echo "https://claudecode2.codefast.app" ;;
        *) echo "" ;;
    esac
}

codefast_text_provider_protocol() {
    case "$1" in
        glm-main) echo "anthropic" ;;
        *) echo "" ;;
    esac
}

codefast_text_provider_model() {
    local provider_id="$1"
    local task_type="${2:-general}"

    case "$provider_id" in
        glm-main)
            echo "GLM-5.1"
            ;;
        *)
            echo ""
            ;;
    esac
}

codefast_cover_provider_order() {
    if [ -n "${BOOK_COVER_PROVIDER_ORDER:-}" ]; then
        printf '%s\n' "$BOOK_COVER_PROVIDER_ORDER"
    else
        printf '%s\n' "grok-imagine nano-banana-pro nano-banana-2"
    fi
}

codefast_cover_provider_group() {
    case "$1" in
        vertex-imagen*) echo "vertex-imagen" ;;
        nano-banana-pro|nano-banana-2|veo-3.1) echo "nano-studio" ;;
        *) echo "$1" ;;
    esac
}

codefast_error_is_limit_related() {
    local text
    text="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
    case "$text" in
        *"quota"*|*"daily limit"*|*"rate limit"*|*"too many requests"*|*"credits"*|*"exhausted"*|*"limit reached"*)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

codefast_mark_limit_if_needed() {
    local provider_id="$1"
    local http_code="$2"
    local response="$3"

    if [ "$http_code" = "429" ] || codefast_error_is_limit_related "$response"; then
        codefast_mark_provider_exhausted "$provider_id" "daily_limit_or_rate_limit"
        return 0
    fi
    return 1
}

codefast_forced_provider_for_model() {
    case "$1" in
        GLM-5.1) echo "glm-main" ;;
        *)
            echo ""
            ;;
    esac
}
