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
        "${codefast:-}" \
        "${OPENAI_API_KEY:-}" \
        "${GEMINI_API_KEY:-}" \
        "${GROQ_API_KEY:-}" \
        "${ANTHROPIC_API_KEY:-}"
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
        claude-main) echo "Claude Codefast" ;;
        codex-main) echo "Codex Codefast" ;;
        gemini-main) echo "Gemini Codefast" ;;
        glm-main) echo "GLM Codefast" ;;
        qwen-main) echo "Qwen Codefast" ;;
        grok-main) echo "Grok Codefast" ;;
        api13-premium) echo "API13 Premium" ;;
        api5-open) echo "API5 Open Models" ;;
        api3-chat) echo "API3 Chat" ;;
        ollama-local) echo "Ollama Local" ;;
        grok-imagine) echo "Grok Imagine" ;;
        nano-studio) echo "Nano/VEO Studio" ;;
        *) echo "$1" ;;
    esac
}

codefast_provider_daily_limit() {
    case "$1" in
        claude-main) echo 600 ;;
        codex-main) echo 1000 ;;
        gemini-main) echo 750 ;;
        glm-main) echo 1000 ;;
        qwen-main) echo 1000 ;;
        grok-main) echo 600 ;;
        api13-premium) echo 600 ;;
        api5-open) echo 1000 ;;
        api3-chat) echo 1000 ;;
        grok-imagine) echo 100 ;;
        nano-studio) echo 300 ;;
        ollama-local) echo 999999 ;;
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
    printf '%s\n' "claude-main codex-main gemini-main glm-main qwen-main grok-main api13-premium api5-open api3-chat ollama-local"
}

codefast_text_provider_order() {
    if [ -n "${CODEFAST_TEXT_PROVIDER_ORDER:-}" ]; then
        printf '%s\n' "$CODEFAST_TEXT_PROVIDER_ORDER"
        return 0
    fi

    case "$1" in
        analytical|quality_check|plagiarism_check|research_strategy)
            printf '%s\n' "codex-main glm-main api5-open claude-main api3-chat api13-premium gemini-main grok-main qwen-main ollama-local"
            ;;
        chapter_rewrite|rewrite|creative|outline|continuation)
            printf '%s\n' "codex-main glm-main api5-open claude-main api3-chat api13-premium gemini-main grok-main qwen-main ollama-local"
            ;;
        summary|general|*)
            printf '%s\n' "codex-main glm-main api5-open claude-main api3-chat api13-premium gemini-main grok-main qwen-main ollama-local"
            ;;
    esac
}

codefast_text_provider_base_url() {
    case "$1" in
        claude-main) echo "https://claudecode.codefast.app" ;;
        codex-main) echo "https://codex.codefast.app/v1" ;;
        gemini-main) echo "https://api14.codefast.app" ;;
        glm-main) echo "https://claudecode2.codefast.app" ;;
        qwen-main) echo "https://api11.codefast.app/v1" ;;
        grok-main) echo "https://api12.codefast.app/v1" ;;
        api13-premium) echo "https://api13.codefast.app/v1" ;;
        api5-open) echo "https://api5.codefast.app/openai/v1" ;;
        api3-chat) echo "https://api3.codefast.app/v1" ;;
        ollama-local) echo "${OLLAMA_BASE_URL:-${OLLAMA_HOST:-http://localhost:11434}}" ;;
        *) echo "" ;;
    esac
}

codefast_text_provider_protocol() {
    case "$1" in
        claude-main|glm-main) echo "anthropic" ;;
        codex-main) echo "responses" ;;
        gemini-main|qwen-main|grok-main|api13-premium|api5-open|api3-chat) echo "openai-chat" ;;
        ollama-local) echo "ollama" ;;
        *) echo "" ;;
    esac
}

codefast_text_provider_model() {
    local provider_id="$1"
    local task_type="${2:-general}"

    case "$provider_id" in
        claude-main)
            case "$task_type" in
                summary) echo "claude-haiku-4-5" ;;
                *) echo "claude-sonnet-4-6" ;;
            esac
            ;;
        codex-main)
            case "$task_type" in
                analytical|quality_check|research_strategy) echo "gpt-5.4" ;;
                chapter_rewrite|rewrite) echo "gpt-5.2" ;;
                *) echo "gpt-5.4" ;;
            esac
            ;;
        gemini-main)
            case "$task_type" in
                summary) echo "gemini-3-flash" ;;
                *) echo "gemini-3.1-pro" ;;
            esac
            ;;
        glm-main)
            echo "GLM-5.1"
            ;;
        qwen-main)
            case "$task_type" in
                analytical|quality_check|research_strategy) echo "Qwen3.5-Coder" ;;
                *) echo "Qwen3.5" ;;
            esac
            ;;
        grok-main)
            echo "grok-4.20-beta"
            ;;
        api13-premium)
            if [ -n "${CODEFAST_API13_MODEL:-}" ]; then
                echo "$CODEFAST_API13_MODEL"
            else
                case "$task_type" in
                    analytical|quality_check|research_strategy) echo "gpt-5.1" ;;
                    summary) echo "gpt-5-mini-high" ;;
                    *) echo "claude-sonnet-4-5-20250929" ;;
                esac
            fi
            ;;
        api5-open)
            if [ -n "${CODEFAST_API5_MODEL:-}" ]; then
                echo "$CODEFAST_API5_MODEL"
            else
                case "$task_type" in
                    analytical|quality_check|research_strategy) echo "MiniMaxAI/MiniMax-M2.5-TEE" ;;
                    *) echo "Qwen/Qwen2.5-72B-Instruct" ;;
                esac
            fi
            ;;
        api3-chat)
            if [ -n "${CODEFAST_API3_MODEL:-}" ]; then
                echo "$CODEFAST_API3_MODEL"
            else
                case "$task_type" in
                    analytical|quality_check|research_strategy) echo "gpt-5.1" ;;
                    *) echo "claude-4-5-sonnet" ;;
                esac
            fi
            ;;
        ollama-local)
            echo "${OLLAMA_PREFERRED_MODEL:-llama3.2:1b}"
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
        grok-imagine) echo "grok-imagine" ;;
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
        claude-haiku-4-5|claude-sonnet-4-6|claude-opus-4-6) echo "claude-main" ;;
        gpt-5.4|gpt-5.3-codex|gpt-5.2) echo "codex-main" ;;
        gemini-3.1-pro|gemini-3-flash) echo "gemini-main" ;;
        GLM-5.1) echo "glm-main" ;;
        Qwen3.5|Qwen3.5-Coder) echo "qwen-main" ;;
        grok-4.20-beta) echo "grok-main" ;;
        qwen3-max-preview|qwen3-max-2025-09-23|qwen3-max-2025-09-26|qwen3-max-2025-10-20|claude-sonnet-4-5-20250929|claude-opus-4-1-20250805|gpt-5-high|gpt-5-chat|gpt-5-mini-high|grok-4-fast|grok-4-0709)
            echo "api13-premium"
            ;;
        Qwen/Qwen2.5-72B-Instruct|Qwen/Qwen3.5-397B-A17B-TEE|Qwen/Qwen3-32B-TEE|Qwen/Qwen3-Coder-Next-TEE|MiniMaxAI/MiniMax-M2.5-TEE|moonshotai/Kimi-K2.5-TEE)
            echo "api5-open"
            ;;
        claude-4-5-sonnet|claude-4.5-sonnet-think|gpt-5-think|gpt-5.1-search|gpt-5-think-search|claude-4-5-sonnet-search|claude-4.5-sonnet-think-search|gemini-3-pro|gemini-3-pro-search)
            echo "api3-chat"
            ;;
        llama*|qwen*|gemma*|phi*|mixtral*|tinyllama*)
            echo "ollama-local"
            ;;
        *)
            echo ""
            ;;
    esac
}
