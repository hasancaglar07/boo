#!/usr/bin/env bash

# Codefast cover generation with automatic image-provider fallback.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd)"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/codefast_provider_lib.sh"

COVERS_DIR="${BOOK_COVERS_DIR:-${SCRIPT_DIR}/covers}"
CONFIG_FILE="${BOOK_COVER_CONFIG_FILE:-${SCRIPT_DIR}/.cover-config.json}"
DEFAULT_SERVICE="${BOOK_COVER_SERVICE:-auto}"
IMAGE_POLL_INTERVAL="${IMAGE_POLL_INTERVAL:-3}"
IMAGE_POLL_ATTEMPTS="${IMAGE_POLL_ATTEMPTS:-30}"
NANO_IMAGE_MODEL_PRO="gemini-3.0-pro"
NANO_IMAGE_MODEL_FLASH="gemini-3.1-flash"
COMPOSER_SCRIPT="$SCRIPT_DIR/compose_cover_text.py"
QUALITY_SCRIPT="$SCRIPT_DIR/cover_quality_gate.py"
COVER_VARIANT_ATTEMPTS="${COVER_VARIANT_ATTEMPTS:-3}"
COVER_MIN_SCORE_FRONT="${COVER_MIN_SCORE_FRONT:-72}"
COVER_MIN_SCORE_BACK="${COVER_MIN_SCORE_BACK:-78}"
COVER_EARLY_ACCEPT_FRONT="${COVER_EARLY_ACCEPT_FRONT:-84}"
COVER_EARLY_ACCEPT_BACK="${COVER_EARLY_ACCEPT_BACK:-88}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

resolve_python_command() {
    if command -v python >/dev/null 2>&1; then
        echo "python"
        return 0
    fi
    if command -v python3 >/dev/null 2>&1; then
        echo "python3"
        return 0
    fi
    return 1
}

check_dependencies() {
    command -v curl >/dev/null 2>&1 || { print_error "curl is required"; exit 1; }
    command -v jq >/dev/null 2>&1 || { print_error "jq is required"; exit 1; }
    command -v base64 >/dev/null 2>&1 || { print_error "base64 is required"; exit 1; }
    [ -f "$COMPOSER_SCRIPT" ] || { print_error "compose_cover_text.py is required"; exit 1; }
    [ -f "$QUALITY_SCRIPT" ] || { print_error "cover_quality_gate.py is required"; exit 1; }

    local python_cmd
    python_cmd="$(resolve_python_command)" || { print_error "python or python3 is required"; exit 1; }
    "$python_cmd" - <<'PY' >/dev/null 2>&1 || { print_error "Pillow is required for deterministic cover composition"; exit 1; }
from PIL import Image
print(Image)
PY
}

setup_directories() {
    mkdir -p "$COVERS_DIR/front" "$COVERS_DIR/back"
}

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        SERVICE="$(jq -r '.service // "auto"' "$CONFIG_FILE")"
        BOOK_TITLE="$(jq -r '.book_title // ""' "$CONFIG_FILE")"
        BOOK_SUBTITLE="$(jq -r '.book_subtitle // ""' "$CONFIG_FILE")"
        AUTHOR_NAME="$(jq -r '.author_name // ""' "$CONFIG_FILE")"
        GENRE="$(jq -r '.genre // "non-fiction"' "$CONFIG_FILE")"
        THEME_SUMMARY="$(jq -r '.theme_summary // ""' "$CONFIG_FILE")"
        BACK_COVER_BLURB="$(jq -r '.back_cover_blurb // ""' "$CONFIG_FILE")"
        AUTHOR_BIO="$(jq -r '.author_bio // ""' "$CONFIG_FILE")"
        PUBLISHER_NAME="$(jq -r '.publisher_name // ""' "$CONFIG_FILE")"
        PUBLICATION_YEAR="$(jq -r '.publication_year // ""' "$CONFIG_FILE")"
        LABEL_LINE="$(jq -r '.label_line // ""' "$CONFIG_FILE")"
        COVER_PROMPT="$(jq -r '.cover_prompt // ""' "$CONFIG_FILE")"
    else
        SERVICE="$DEFAULT_SERVICE"
        BOOK_TITLE=""
        BOOK_SUBTITLE=""
        AUTHOR_NAME=""
        GENRE="non-fiction"
        THEME_SUMMARY=""
        BACK_COVER_BLURB=""
        AUTHOR_BIO=""
        PUBLISHER_NAME=""
        PUBLICATION_YEAR=""
        LABEL_LINE=""
        COVER_PROMPT=""
    fi
}

save_config() {
    cat > "$CONFIG_FILE" << EOF
{
  "service": "$SERVICE",
  "book_title": "$BOOK_TITLE",
  "book_subtitle": "$BOOK_SUBTITLE",
  "author_name": "$AUTHOR_NAME",
  "genre": "$GENRE",
  "theme_summary": "$THEME_SUMMARY",
  "back_cover_blurb": "$BACK_COVER_BLURB",
  "author_bio": "$AUTHOR_BIO",
  "publisher_name": "$PUBLISHER_NAME",
  "publication_year": "$PUBLICATION_YEAR",
  "label_line": "$LABEL_LINE",
  "cover_prompt": "$COVER_PROMPT"
}
EOF
}

configure_settings() {
    print_status "Configuring Codefast cover generation..."
    echo "Select image generation service:"
    echo "1) Auto fallback (Vertex Imagen - Banana Pro - Banana 2)"
    echo "2) Vertex Imagen"
    echo "3) Nano Banana Pro"
    echo "4) Nano Banana 2"
    read -r -p "Enter choice (1-4) [default: 1]: " service_choice

        2) SERVICE="vertex-imagen-standard" ;;
        3) SERVICE="nano-banana-pro" ;;
        4) SERVICE="nano-banana-2" ;;
        4) SERVICE="nano-banana-2" ;;
        *) SERVICE="auto" ;;
    esac

    read -r -p "Enter book title: " BOOK_TITLE
    read -r -p "Enter author name: " AUTHOR_NAME
    read -r -p "Enter book genre: " GENRE

    save_config
    print_success "Configuration saved."
}

generate_prompts() {
    local cover_type="$1"
    local prompt_subject=""
    local genre_label=""
    local cleaned_theme=""
    local cleaned_words=""
    local keyword_source=""
    local keyword_hints=()
    local joined_hints=""

    if [[ "$cover_type" == "front" && -n "$COVER_PROMPT" ]]; then
        printf '%s\n' "$COVER_PROMPT"
        return 0
    fi

    genre_label="$GENRE"
    if [[ -z "$genre_label" ]]; then
        genre_label="non-fiction"
    fi

    cleaned_theme="$(printf '%s' "$THEME_SUMMARY" \
        | tr '\n' ' ' \
        | sed -E "s/[0-9]{1,4}//g; s/[\"'â€œâ€â€˜â€™:;,.()\\/_-]+/ /g; s/[[:space:]]+/ /g; s/^ //; s/ $//")"
    cleaned_words="$(printf '%s\n' "$cleaned_theme" | awk '{for (i = 1; i <= NF && i <= 12; i++) printf("%s%s", $i, (i < NF && i < 12 ? " " : ""))}')"

    if [[ -n "$cleaned_words" && ${#cleaned_words} -le 96 ]]; then
        prompt_subject="$cleaned_words"
    else
        keyword_source="$(printf '%s %s %s' "$LABEL_LINE" "$BOOK_SUBTITLE" "$THEME_SUMMARY" | tr '[:upper:]' '[:lower:]')"
        if [[ "$keyword_source" == *vision* || "$keyword_source" == *gÃ¶rÃ¼* || "$keyword_source" == *gorsel* ]]; then
            keyword_hints+=("machine vision systems")
        fi
        if [[ "$keyword_source" == *coding* || "$keyword_source" == *code* || "$keyword_source" == *yazÄ±lÄ±m* || "$keyword_source" == *kod* ]]; then
            keyword_hints+=("software architecture")
        fi
        if [[ "$keyword_source" == *reason* || "$keyword_source" == *mantÄ±k* || "$keyword_source" == *akÄ±l* ]]; then
            keyword_hints+=("reasoning engines")
        fi
        if [[ "$keyword_source" == *"gerÃ§ek zaman"* || "$keyword_source" == *"real time"* || "$keyword_source" == *live* ]]; then
            keyword_hints+=("live data streams")
        fi
        if [[ "$keyword_source" == *ai* || "$keyword_source" == *"yapay zeka"* || "$keyword_source" == *agent* || "$keyword_source" == *ajan* ]]; then
            keyword_hints+=("intelligent agent systems")
        fi
        if [[ "${#keyword_hints[@]}" -gt 0 ]]; then
            joined_hints="$(IFS=', '; printf '%s' "${keyword_hints[*]}")"
            prompt_subject="$joined_hints"
        fi
    fi

    if [[ -z "$prompt_subject" ]]; then
        case "${genre_label,,}" in
            *tech*|*technology*|*science*|*ai*|*software*|*code*|*business*)
                prompt_subject="a futuristic intelligence core, luminous data streams, machine vision, and precise software systems"
                ;;
            *history*|*biyografi*|*biography*|*politic*)
                prompt_subject="an authoritative symbolic scene with archival depth, human focus, and strong atmosphere"
                ;;
            *fantasy*|*fiction*|*roman*|*novel*)
                prompt_subject="a cinematic symbolic scene with dramatic atmosphere, texture, and depth"
                ;;
            *)
                prompt_subject="a premium symbolic scene with cinematic lighting, depth, and elegant negative space"
                ;;
        esac
    fi

    if [[ "$cover_type" == "front" ]]; then
        cat << EOF
Create premium portrait editorial background artwork for a serious ${genre_label} book about ${prompt_subject}. Use layered futuristic structures, cinematic lighting, refined texture, atmospheric depth, and calm negative space near the top and bottom. Make it feel like a high-end nonfiction bestseller cover. No words, no letters, no numbers, no symbols, no logos, no monograms, no emblems, no interface elements, no watermarks, no physical book, no spine, no printed page, and no mockup scene.
EOF
    else
        cat << EOF
Create coordinated portrait editorial background artwork for the back of the same ${genre_label} book about ${prompt_subject}. Keep it calmer and cleaner than the front, with subtle continuity, soft atmospheric texture, low detail through the main reading area, and a quiet lower-right corner for a barcode. No words, no letters, no numbers, no symbols, no logos, no monograms, no emblems, no interface elements, no watermarks, no physical book, no spine, no printed page, and no mockup scene.
EOF
    fi
}

quality_min_score_for_cover() {
    case "$1" in
        front) printf '%s\n' "$COVER_MIN_SCORE_FRONT" ;;
        back) printf '%s\n' "$COVER_MIN_SCORE_BACK" ;;
        *) printf '%s\n' "0" ;;
    esac
}

quality_early_accept_for_cover() {
    case "$1" in
        front) printf '%s\n' "$COVER_EARLY_ACCEPT_FRONT" ;;
        back) printf '%s\n' "$COVER_EARLY_ACCEPT_BACK" ;;
        *) printf '%s\n' "100" ;;
    esac
}

variant_prompt_suffix() {
    local cover_type="$1"
    local attempt="$2"

    case "${cover_type}:${attempt}" in
        front:1) printf '%s\n' "Favor sharp architectural layering, premium contrast, and a clean center silhouette." ;;
        front:2) printf '%s\n' "Favor luminous intelligence motifs, precise geometry, and especially clean edges." ;;
        front:3) printf '%s\n' "Favor editorial abstraction, refined depth, and a bolder premium composition." ;;
        front:4) printf '%s\n' "Favor elegant machine structures, restrained highlights, and uncluttered negative space." ;;
        back:1) printf '%s\n' "Keep the central reading area especially quiet and calm." ;;
        back:2) printf '%s\n' "Use subtler texture with more separation between the reading area and the edge detail." ;;
        back:3) printf '%s\n' "Favor a cleaner premium atmosphere with a softer right-side accent band." ;;
        back:4) printf '%s\n' "Favor minimal detail in the lower-right barcode corner and smoother gradients overall." ;;
        *) printf '%s\n' "" ;;
    esac
}

build_variant_prompt() {
    local base_prompt="$1"
    local cover_type="$2"
    local attempt="$3"
    local suffix

    suffix="$(variant_prompt_suffix "$cover_type" "$attempt")"
    if [[ -n "$suffix" ]]; then
        printf '%s %s\n' "$base_prompt" "$suffix"
    else
        printf '%s\n' "$base_prompt"
    fi
}

api_key_or_fail() {
    local key
    key="$(resolve_codefast_api_key 2>/dev/null || true)"
    if [[ -z "$key" ]]; then
        print_error "CODEFAST_API_KEY is required for AI cover generation."
        exit 1
    fi
    printf '%s\n' "$key"
}

save_image_from_json() {
    local response="$1"
    local output_file="$2"
    local url=""
    local b64=""

    url="$(printf '%s' "$response" | jq -r '
        .data[0].url //
        .url //
        .result.url //
        .job.result.url //
        .job.result.storage_url //
        .job.result.storage_urls[0] //
        .storage_url //
        .storage_urls[0] //
        empty
    ' 2>/dev/null)"

    if [[ -n "$url" && "$url" != "null" ]]; then
        curl -L -sS "$url" -o "$output_file"
        [[ -s "$output_file" ]]
        return
    fi

    b64="$(printf '%s' "$response" | jq -r '
        .data[0].b64_json //
        .b64_json //
        .images[0] //
        .job.result.images[0] //
        empty
    ' 2>/dev/null)"

    if [[ -n "$b64" && "$b64" != "null" ]]; then
        printf '%s' "$b64" | base64 --decode > "$output_file"
        [[ -s "$output_file" ]]
        return
    fi

    return 1
}

grok_history_image() {
    local api_key="$1"
    local prompt="$2"
    local history
    local url=""

    history="$(curl -sS \
        -H "Authorization: Bearer ${api_key}" \
        "https://grokapi.codefast.app/v1/history?page=1&per_page=10")" || return 1

    url="$(printf '%s' "$history" | jq -r --arg prompt "$prompt" '
        (
            [.items[]? | select((.type // "image") == "image") | select((.prompt // "") == $prompt) | .url][0]
        ) //
        (
            [.items[]? | select((.type // "image") == "image") | .url][0]
        ) //
        empty
    ' 2>/dev/null)"

    if [[ -n "$url" && "$url" != "null" ]]; then
        printf '%s\n' "$url"
        return 0
    fi
    return 1
}

generate_with_grok_imagine() {
    local prompt="$1"
    local output_file="$2"
    local provider_group="grok-imagine"
    local api_key
    local response
    local http_code
    local response_file
    local url=""

    if codefast_provider_is_exhausted "$provider_group"; then
        print_warning "Skipping Grok Imagine because the local daily limit tracker is exhausted."
        return 1
    fi

    api_key="$(api_key_or_fail)"
    response_file="$(mktemp)"
    http_code="$(curl -sS --max-time 180 -o "$response_file" -w "%{http_code}" \
        -H "Authorization: Bearer ${api_key}" \
        -H "Content-Type: application/json" \
        -d "$(jq -nc --arg prompt "$prompt" '{prompt: $prompt, aspect_ratio: "2:3", n: 1}')" \
        "https://grokapi.codefast.app/v1/images/generations")"
    response="$(cat "$response_file")"
    rm -f "$response_file"

    codefast_increment_provider_usage "$provider_group"

    if [[ "$http_code" =~ ^2 ]] && save_image_from_json "$response" "$output_file"; then
        return 0
    fi

    if [[ "$http_code" =~ ^2 ]]; then
        local attempt=1
        while [[ "$attempt" -le "$IMAGE_POLL_ATTEMPTS" ]]; do
            url="$(grok_history_image "$api_key" "$prompt" || true)"
            if [[ -n "$url" ]]; then
                curl -L -sS "$url" -o "$output_file"
                [[ -s "$output_file" ]] && return 0
            fi
            sleep "$IMAGE_POLL_INTERVAL"
            attempt=$((attempt + 1))
        done
    fi

    if codefast_mark_limit_if_needed "$provider_group" "$http_code" "$response"; then
        print_warning "Grok Imagine limit or rate restriction detected."
    else
        print_warning "Grok Imagine failed: $(printf '%s' "$response" | jq -r '.error // .message // "unknown error"' 2>/dev/null)"
    fi
    return 1
}

poll_nano_image_job() {
    local api_key="$1"
    local job_id="$2"
    local output_file="$3"
    local status_response=""
    local attempt=1

    while [[ "$attempt" -le "$IMAGE_POLL_ATTEMPTS" ]]; do
        status_response="$(curl -sS \
            -H "Authorization: Bearer ${api_key}" \
            -H "Content-Type: application/json" \
            -d "$(jq -nc --arg job_id "$job_id" '{job_id: $job_id}')" \
            "https://geminiapi.codefast.app/v1/image/status")" || true

        local status=""
        status="$(printf '%s' "$status_response" | jq -r '.job.status // empty' 2>/dev/null)"

        case "$status" in
            SUCCESS)
                save_image_from_json "$status_response" "$output_file" && return 0
                ;;
            ERROR|CANCELED|CANCELLED)
                return 1
                ;;
        esac

        sleep "$IMAGE_POLL_INTERVAL"
        attempt=$((attempt + 1))
    done

    return 1
}

generate_with_nano_model() {
    local prompt="$1"
    local output_file="$2"
    local model="$3"
    local provider_group="nano-studio"
    local api_key
    local response
    local http_code
    local response_file
    local job_id=""

    if codefast_provider_is_exhausted "$provider_group"; then
        print_warning "Skipping Nano/VEO Studio because the local daily limit tracker is exhausted."
        return 1
    fi

    api_key="$(api_key_or_fail)"
    response_file="$(mktemp)"
    http_code="$(curl -sS --max-time 180 -o "$response_file" -w "%{http_code}" \
        -H "Authorization: Bearer ${api_key}" \
        -H "Content-Type: application/json" \
        -d "$(jq -nc --arg prompt "$prompt" --arg model "$model" '{prompt: $prompt, aspect_ratio: "portrait", model: $model, seed: null}')" \
        "https://geminiapi.codefast.app/v1/image")"
    response="$(cat "$response_file")"
    rm -f "$response_file"

    codefast_increment_provider_usage "$provider_group"

    if ! [[ "$http_code" =~ ^2 ]]; then
        if codefast_mark_limit_if_needed "$provider_group" "$http_code" "$response"; then
            print_warning "Nano/VEO Studio limit or rate restriction detected."
        else
            print_warning "Nano/VEO Studio failed: $(printf '%s' "$response" | jq -r '.error // .message // "unknown error"' 2>/dev/null)"
        fi
        return 1
    fi

    job_id="$(printf '%s' "$response" | jq -r '.jobId // .job_id // empty' 2>/dev/null)"
    if [[ -z "$job_id" ]]; then
        print_warning "Nano/VEO Studio did not return a job id."
        return 1
    fi

    poll_nano_image_job "$api_key" "$job_id" "$output_file"
}

service_to_provider_sequence() {
    case "$1" in
        auto|"")
            codefast_cover_provider_order
            ;;
        grok|grok-imagine|codefast-grok)
            echo "grok-imagine"
            ;;
        nano-banana-pro|codefast-nano-banana-pro)
            echo "nano-banana-pro"
            ;;
        nano-banana-2|codefast-nano-banana-2)
            echo "nano-banana-2"
            ;;
        *)
            echo "$1"
            ;;
    esac
}

generate_cover_with_fallback() {
    local prompt="$1"
    local output_file="$2"
    local provider=""
    local sequence

    sequence="$(service_to_provider_sequence "$SERVICE")"

    for provider in $sequence; do
        print_status "Trying cover provider: ${provider}"
        case "$provider" in
            grok-imagine)
                if generate_with_grok_imagine "$prompt" "$output_file"; then
                    print_success "Cover generated with Grok Imagine"
                    return 0
                fi
                ;;
            nano-banana-pro)
                if generate_with_nano_model "$prompt" "$output_file" "$NANO_IMAGE_MODEL_PRO"; then
                    print_success "Cover generated with Nano Banana Pro"
                    return 0
                fi
                ;;
            nano-banana-2)
                if generate_with_nano_model "$prompt" "$output_file" "$NANO_IMAGE_MODEL_FLASH"; then
                    print_success "Cover generated with Nano Banana 2"
                    return 0
                fi
                ;;
            veo-3.1)
                print_warning "Veo 3.1 is video-focused and is skipped for static cover generation."
                ;;
            *)
                print_warning "Unknown cover provider: ${provider}"
                ;;
        esac
    done

    return 1
}

compose_cover_layout() {
    local cover_type="$1"
    local art_file="$2"
    local output_file="$3"
    local python_cmd

    python_cmd="$(resolve_python_command)" || {
        print_error "python runtime not found for deterministic cover composition"
        return 1
    }

    "$python_cmd" "$COMPOSER_SCRIPT" \
        --config "$CONFIG_FILE" \
        --cover-type "$cover_type" \
        --input "$art_file" \
        --output "$output_file"
}

evaluate_cover_quality() {
    local cover_type="$1"
    local art_file="$2"
    local min_score="$3"
    local python_cmd

    python_cmd="$(resolve_python_command)" || {
        print_error "python runtime not found for cover quality evaluation"
        return 1
    }

    "$python_cmd" "$QUALITY_SCRIPT" \
        --cover-type "$cover_type" \
        --input "$art_file" \
        --min-score "$min_score"
}

generate_single_cover() {
    local cover_type="$1"
    local base_prompt
    local prompt
    local output_file
    local art_file
    local best_art_file=""
    local best_metrics_file=""
    local best_score=""
    local best_attempt=0
    local min_score
    local early_accept_score
    local attempt
    local candidate_art_file
    local candidate_metrics_file
    local quality_json
    local score
    local decision
    local warnings
    local selected_art_file
    local selected_metrics_file
    local stable_metrics_file

    base_prompt="$(generate_prompts "$cover_type")"
    output_file="${COVERS_DIR}/${cover_type}/${BOOK_TITLE// /_}_${cover_type}_cover.png"
    art_file="${COVERS_DIR}/${cover_type}/${BOOK_TITLE// /_}_${cover_type}_art.png"
    stable_metrics_file="${COVERS_DIR}/${cover_type}/${BOOK_TITLE// /_}_${cover_type}_quality.json"
    min_score="$(quality_min_score_for_cover "$cover_type")"
    early_accept_score="$(quality_early_accept_for_cover "$cover_type")"

    for ((attempt = 1; attempt <= COVER_VARIANT_ATTEMPTS; attempt++)); do
        prompt="$(build_variant_prompt "$base_prompt" "$cover_type" "$attempt")"
        candidate_art_file="${COVERS_DIR}/${cover_type}/${BOOK_TITLE// /_}_${cover_type}_candidate_$(printf '%02d' "$attempt")_art.png"
        candidate_metrics_file="${COVERS_DIR}/${cover_type}/${BOOK_TITLE// /_}_${cover_type}_candidate_$(printf '%02d' "$attempt")_quality.json"

        if ! generate_cover_with_fallback "$prompt" "$candidate_art_file"; then
            continue
        fi

        quality_json="$(evaluate_cover_quality "$cover_type" "$candidate_art_file" "$min_score")" || {
            print_warning "Quality evaluation failed for ${cover_type} candidate ${attempt}; using the first successful image if needed."
            quality_json='{"score": 0, "decision": "retry", "warnings": ["quality evaluation failed"]}'
        }
        printf '%s\n' "$quality_json" > "$candidate_metrics_file"

        score="$(printf '%s' "$quality_json" | jq -r '.score // 0')"
        decision="$(printf '%s' "$quality_json" | jq -r '.decision // "retry"')"
        warnings="$(printf '%s' "$quality_json" | jq -r '(.warnings // []) | join("; ")')"

        if [[ -z "$best_score" ]] || awk "BEGIN { exit !($score > $best_score) }"; then
            best_score="$score"
            best_art_file="$candidate_art_file"
            best_metrics_file="$candidate_metrics_file"
            best_attempt="$attempt"
        fi

        if [[ -n "$warnings" ]]; then
            print_status "${cover_type} candidate ${attempt} score ${score} (${decision}) - ${warnings}"
        else
            print_status "${cover_type} candidate ${attempt} score ${score} (${decision})"
        fi

        if awk "BEGIN { exit !($score >= $early_accept_score) }"; then
            print_success "${cover_type} cover candidate ${attempt} met the early-accept quality threshold."
            break
        fi
    done

    if [[ -z "$best_art_file" ]]; then
        print_error "All configured cover providers failed for ${cover_type} cover."
        return 1
    fi

    selected_art_file="$best_art_file"
    selected_metrics_file="$best_metrics_file"
    cp "$selected_art_file" "$art_file"
    cp "$selected_metrics_file" "$stable_metrics_file"

    if awk "BEGIN { exit !($best_score < $min_score) }"; then
        print_warning "${cover_type} cover did not reach the target quality threshold (${best_score} < ${min_score}); using best available candidate ${best_attempt}."
    else
        print_success "${cover_type} cover selected candidate ${best_attempt} with score ${best_score}."
    fi

    print_status "Applying deterministic typography layout to ${cover_type} cover..."
    compose_cover_layout "$cover_type" "$art_file" "$output_file" || {
        print_error "Failed to compose deterministic ${cover_type} cover layout."
        return 1
    }
    printf '%s\n' "$output_file"
    return 0
}

generate_covers() {
    print_status "Generating both covers..."
    generate_single_cover "front"
    generate_single_cover "back"
}

show_help() {
    cat << EOF
Codefast Cover Generation

Usage: $0 [OPTIONS]

Options:
  -c, --configure     Configure book title, author, genre, and preferred service
  -g, --generate      Generate both front and back covers
  -f, --front-only    Generate only the front cover
  -b, --back-only     Generate only the back cover
  -s, --service       Set service (auto|grok-imagine|nano-banana-pro|nano-banana-2)
  -h, --help          Show this help

Notes:
  - Uses CODEFAST_API_KEY / codefast / existing API key env vars as the shared key
  - Auto mode fallback: Grok Imagine -> Nano Banana Pro -> Nano Banana 2
  - Final covers always receive deterministic local typography and text-safe back-cover layout
  - Quality gate: generates multiple variants, scores them, and keeps the best one automatically
EOF
}

main() {
    case "${1:-}" in
        -h|--help)
            show_help
            return 0
            ;;
        *)
            check_dependencies
            setup_directories
            load_config
            ;;
    esac

    case "${1:-}" in
        -c|--configure)
            configure_settings
            ;;
        -g|--generate)
            if [[ -z "$BOOK_TITLE" ]]; then
                print_error "Configuration required. Run with --configure first."
                exit 1
            fi
            generate_covers
            ;;
        -f|--front-only)
            if [[ -z "$BOOK_TITLE" ]]; then
                print_error "Configuration required. Run with --configure first."
                exit 1
            fi
            generate_single_cover "front"
            ;;
        -b|--back-only)
            if [[ -z "$BOOK_TITLE" ]]; then
                print_error "Configuration required. Run with --configure first."
                exit 1
            fi
            generate_single_cover "back"
            ;;
        -s|--service)
            if [[ -z "${2:-}" ]]; then
                print_error "Service value required."
                exit 1
            fi
            SERVICE="$2"
            save_config
            print_success "Service set to $SERVICE"
            ;;
        -h|--help|*)
            show_help
            ;;
    esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
