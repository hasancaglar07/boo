#!/usr/bin/env bash

# GLM-5.1 API system for book generation.

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd)"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/codefast_provider_lib.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

CODEFAST_REASONING_EFFORT="${CODEFAST_REASONING_EFFORT:-high}"
CODEFAST_CURL_MAX_TIME="${CODEFAST_CURL_MAX_TIME:-180}"

# ============================================================================
# GENERAL HELPERS
# ============================================================================

sanitize_temperature() {
    local value="${1:-0.7}"

    if [ -z "$value" ]; then
        echo "0.7"
        return 0
    fi

    if [[ "$value" =~ ^\.[0-9]+$ ]]; then
        value="0$value"
    fi

    if ! [[ "$value" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
        echo "0.7"
        return 0
    fi

    echo "$value"
}

sanitize_max_tokens() {
    local value="${1:-4096}"
    if ! [[ "$value" =~ ^[0-9]+$ ]] || [ "$value" -le 0 ]; then
        echo "4096"
        return 0
    fi
    echo "$value"
}

has_any_smart_provider() {
    codefast_has_api_key
}

setup_multi_provider_system() {
    mkdir -p "$CODEFAST_LOG_DIR"

    echo "🔧 Initializing GLM-5.1 API system..."
    if codefast_has_api_key; then
        echo "✅ Shared Codefast API key detected"
        echo "   Text order: $(codefast_text_provider_order general)"
        echo "   Cover order: $(codefast_cover_provider_order)"
    else
        echo "⚠️  Shared Codefast API key not found"
    fi

    return 0
}

extract_response_text() {
    printf '%s' "$1" | jq -r '
        [
            .output_text,
            ([.output[]?.content[]? | select((.type // "") == "output_text" or (.type // "") == "text") | (.text // "")] | join("")),
            (try (
                if (.choices[0].message.content | type) == "string"
                then .choices[0].message.content
                else [.choices[0].message.content[]? | .text // .content // ""] | join("")
                end
            ) catch ""),
            ([.content[]? | select((.type // "") == "text") | (.text // "")] | join(""))
        ]
        | map(select(. != null and . != ""))
        | .[0] // ""
    ' 2>/dev/null
}

sanitize_provider_text() {
    python3 -c 'import re, sys
text = sys.stdin.read()
text = text.replace("\r", "")
text = re.sub(r"(?is)<think>.*?</think>", "", text)
text = re.sub(r"(?im)^---\s*Display Model:.*$", "", text)
sys.stdout.write(text.strip())'
}

extract_error_message() {
    printf '%s' "$1" | jq -r '
        .error.message //
        .error.type //
        .error //
        .message //
        ""
    ' 2>/dev/null
}

mark_limit_if_needed() {
    codefast_mark_limit_if_needed "$@"
}

run_json_request() {
    local method="$1"
    local url="$2"
    local payload="$3"
    shift 3

    local body_file
    local http_code
    body_file="$(mktemp)"

    http_code="$(curl -sS --max-time "$CODEFAST_CURL_MAX_TIME" -o "$body_file" -w "%{http_code}" \
        -X "$method" "$@" \
        -d "$payload" \
        "$url")"
    local curl_status=$?
    local response=""
    [ -f "$body_file" ] && response="$(cat "$body_file")"
    rm -f "$body_file"

    printf '%s\n%s\n%s\n' "$curl_status" "$http_code" "$response"
}

# ============================================================================
# PROVIDER CALLERS
# ============================================================================

call_codefast_anthropic_provider() {
    local provider_id="$1"
    local model="$2"
    local prompt="$3"
    local system_prompt="$4"
    local temperature="$5"
    local max_tokens="$6"
    local api_key
    local payload
    local url
    local result
    local curl_status
    local http_code
    local response
    local text

    api_key="$(resolve_codefast_api_key 2>/dev/null || true)"
    [ -n "$api_key" ] || return 1

    url="$(normalize_base_url "$(codefast_text_provider_base_url "$provider_id")")/v1/messages"
    payload="$(jq -nc \
        --arg model "$model" \
        --arg system "$system_prompt" \
        --arg prompt "$prompt" \
        --argjson temperature "$temperature" \
        --argjson max_tokens "$max_tokens" \
        '{
            model: $model,
            system: $system,
            max_tokens: $max_tokens,
            temperature: $temperature,
            messages: [
                { role: "user", content: $prompt }
            ]
        }')"

    result="$(run_json_request "POST" "$url" "$payload" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $api_key" \
        -H "anthropic-version: 2023-06-01")"
    curl_status="$(printf '%s\n' "$result" | sed -n '1p')"
    http_code="$(printf '%s\n' "$result" | sed -n '2p')"
    response="$(printf '%s\n' "$result" | sed -n '3,$p')"

    if [ "$curl_status" -ne 0 ]; then
        echo "❌ $(codefast_provider_label "$provider_id") request failed at transport level" >&2
        return 1
    fi

    codefast_increment_provider_usage "$provider_id"
    text="$(extract_response_text "$response" | sanitize_provider_text)"

    if [[ "$http_code" =~ ^2 ]] && [ -n "$text" ]; then
        printf '%s\n' "$text"
        return 0
    fi

    if mark_limit_if_needed "$provider_id" "$http_code" "$response"; then
        echo "⚠️ $(codefast_provider_label "$provider_id") upstream rate/limit response detected" >&2
    else
        echo "❌ $(codefast_provider_label "$provider_id") error: $(extract_error_message "$response")" >&2
    fi
    return 1
}

call_text_provider() {
    local provider_id="$1"
    local model="$2"
    local prompt="$3"
    local system_prompt="$4"
    local temperature="$5"
    local max_tokens="$6"
    local max_retries="$7"

    case "$(codefast_text_provider_protocol "$provider_id")" in
        anthropic)
            call_codefast_anthropic_provider "$provider_id" "$model" "$prompt" "$system_prompt" "$temperature" "$max_tokens"
            ;;
        *)
            return 1
            ;;
    esac
}


# ============================================================================
build_provider_sequence() {
    printf '%s\n' "glm-main"
}

# ============================================================================
# CORE ENTRYPOINT
# ============================================================================

smart_api_call() {
    local prompt="$1"
    local system_prompt="$2"
    local task_type="${3:-general}"
    local temperature
    local max_tokens
    local max_retries
    local model_name
    local result
    local attempt
    local retry_delay

    temperature="$(sanitize_temperature "${4:-0.7}")"
    max_tokens="$(sanitize_max_tokens "${5:-4096}")"
    max_retries="${6:-2}"
    if ! [[ "$max_retries" =~ ^[0-9]+$ ]] || [ "$max_retries" -lt 1 ]; then
        max_retries=1
    fi
    retry_delay=1

    if ! codefast_has_api_key; then
        echo "No CODEFAST_API_KEY configured" >&2
        return 1
    fi

    model_name="$(codefast_text_provider_model "glm-main" "$task_type")"
    for ((attempt = 1; attempt <= max_retries; attempt += 1)); do
        echo "Using GLM-5.1 (model: ${model_name}) [attempt ${attempt}/${max_retries}]" >&2
        if result="$(call_text_provider "glm-main" "$model_name" "$prompt" "$system_prompt" "$temperature" "$max_tokens" "$max_retries" 2> >(cat >&2))"; then
            printf '%s\n' "$result"
            return 0
        fi
        if [ "$attempt" -lt "$max_retries" ]; then
            sleep "$retry_delay"
            retry_delay=$((retry_delay * 2))
        fi
    done

    echo "GLM-5.1 request failed after ${max_retries} attempts" >&2
    return 1
}

# BOOK GENERATION FUNCTIONS
# ============================================================================

generate_outline_with_smart_api() {
    local topic="$1"
    local genre="$2"
    local audience="$3"
    local style="${4:-detailed}"
    local tone="${5:-professional}"
    local language="${6:-English}"
    local chapter_label="Chapter"

    case "$(printf '%s' "$language" | tr '[:upper:]' '[:lower:]')" in
        tr*|turkish|türkçe|turkce|turk)
            language="Turkish"
            chapter_label="Bölüm"
            ;;
        *)
            language="English"
            chapter_label="Chapter"
            ;;
    esac

    local system_prompt="You are an expert book author and publishing professional tasked with creating high-quality, commercially viable books for publication on KDP and other platforms. Your goal is to produce engaging, well-structured, and professionally written content that readers will find valuable and enjoyable.

Create detailed book outlines that will guide the generation of 20,000-25,000 word books with 12-15 chapters of 2,500-3,000 words each.

When creating outlines, always format chapter titles clearly as:
${chapter_label} 1: [Title]
${chapter_label} 2: [Title]
etc.

Include comprehensive chapter summaries that will guide detailed content generation. The full output must be in ${language}. DO NOT include any markdown characters or formatting other than numbered lists."

    local user_prompt="Create a detailed outline for a ${genre} book about '${topic}' targeting ${audience}.
Target language: ${language}

REQUIRED FORMAT - Use this exact format for chapters:
${chapter_label} 1: [Chapter Title]
${chapter_label} 2: [Chapter Title]
[etc.]

Include:
- Compelling book title and subtitle
- 12-15 chapters with descriptive titles
- 2-3 sentence summary for each chapter explaining what will be covered
- Character profiles (fiction) or key concept definitions (non-fiction)
- 3-5 core themes to weave throughout the book
- Target reading level and tone guidance
- Suggested word count distribution

Make sure chapter titles are specific and promise clear value to readers. If the target language is Turkish, do not leave headings or labels in English. DO NOT include any markdown characters or formatting other than numbered lists."

    smart_api_call "$user_prompt" "$system_prompt" "outline" 0.7 8192 3 ""
}

generate_chapter_with_smart_api() {
    local chapter_num="$1"
    local chapter_title="$2"
    local existing_chapters="$3"
    local outline="$4"
    local min_words="$5"
    local max_words="$6"
    local style="$7"
    local tone="$8"
    local language="${9:-English}"
    local chapter_label="Chapter"

    case "$(printf '%s' "$language" | tr '[:upper:]' '[:lower:]')" in
        tr*|turkish|türkçe|turkce|turk)
            language="Turkish"
            chapter_label="Bölüm"
            ;;
        *)
            language="English"
            chapter_label="Chapter"
            ;;
    esac

    local system_prompt="You are a professional author writing a high-quality book. Write in ${style} style with ${tone} tone. Ensure content is original, engaging, and valuable to readers. The output language must be ${language}. Return only the chapter body in ${language}; do not add a heading line like '${chapter_label} ${chapter_num}: ${chapter_title}'."

    local user_prompt="Write ${chapter_label} ${chapter_num} for this book.
Target language: ${language}
Section title: ${chapter_title}

Book Outline Context:
${outline}

Previous Chapters (for continuity):
${existing_chapters}

Requirements:
- Write ${min_words}-${max_words} words
- Make it engaging and informative
- Ensure smooth transitions and flow
- Include practical examples where appropriate
- Maintain consistency with previous chapters
- Write in ${style} style with ${tone} tone
- Write fully in ${language}
- Do not add a chapter heading, title line, or English label before the body

Begin writing the chapter body now:"

    smart_api_call "$user_prompt" "$system_prompt" "creative" 0.8 8192 3 ""
}

review_chapter_quality() {
    local chapter_file="$1"
    local content
    content="$(cat "$chapter_file")"

    local system_prompt="You are a senior developmental editor. Improve structure, clarity, originality, and readability while keeping the chapter's intent."
    local user_prompt="Review and improve this chapter. Return only the revised markdown body.

${content}"

    local result
    result="$(smart_api_call "\$user_prompt" "\$system_prompt" "quality_check" 0.4 4096 2 "")" || return 1
    printf '%s\n' "$result" > "$chapter_file"
}

check_plagiarism_with_smart_api() {
    local chapter_file="$1"
    local content
    content="$(cat "$chapter_file")"

    local system_prompt="You are an expert plagiarism checker and originality assessor. Analyze content for originality and potential copyright issues."
    local user_prompt="Analyze this chapter content for originality and plagiarism concerns:

${content}

Provide:
1. Originality score (1-10, where 10 is completely original)
2. Any potential copyright concerns
3. Recommendations for improvement if needed

Be thorough but fair in your assessment."

    local result
    result="$(smart_api_call "$user_prompt" "$system_prompt" "analytical" 0.3 4096 2 "")"

    if echo "$result" | grep -q -E "(score|rating).*[8-9]|10"; then
        return 0
    elif echo "$result" | grep -q -E "(score|rating).*[6-7]"; then
        return 1
    else
        return 2
    fi
}

rewrite_chapter_with_smart_api() {
    local chapter_file="$1"
    local plagiarism_report="$2"
    local content
    local report_content=""
    local result

    content="$(cat "$chapter_file")"
    if [ -f "$plagiarism_report" ]; then
        report_content="$(cat "$plagiarism_report")"
    fi

    local system_prompt="You are an expert editor tasked with rewriting content to improve originality while maintaining quality and message."
    local user_prompt="Rewrite this chapter to improve originality and address plagiarism concerns:

Original Chapter:
${content}

Plagiarism Analysis:
${report_content}

Requirements:
- Maintain the same core message and structure
- Improve originality and uniqueness
- Keep the same word count approximately
- Ensure high quality and readability
- Address any specific concerns mentioned in the analysis

Rewrite the chapter now:"

    result="$(smart_api_call "$user_prompt" "$system_prompt" "chapter_rewrite" 0.8 8192 3 "")" || return 1
    [ -n "$result" ] || return 1
    printf '%s\n' "$result" > "$chapter_file"
}

# ============================================================================
# STATUS AND MONITORING
# ============================================================================

show_provider_status() {
    local label
    local used
    local limit
    local remaining
    local reason

    echo -e "\n${CYAN}📊 Provider Status${RESET}"
    echo "────────────────────────────────────────"

    # glm-main
    label="$(codefast_provider_label "glm-main")"
    used="$(codefast_provider_usage_count "glm-main")"
    limit="$(codefast_provider_daily_limit "glm-main")"
    remaining="$(codefast_provider_remaining "glm-main")"
    reason="$(codefast_provider_exhausted_reason "glm-main")"

    if ! codefast_has_api_key; then
        echo -e "${RED}❌${RESET} ${label} - missing API key"
    elif codefast_provider_is_exhausted "glm-main"; then
        echo -e "${YELLOW}⏳${RESET} ${label} - exhausted (${used}/${limit}) ${reason}"
    elif [ "$limit" -le 0 ]; then
        echo -e "${GREEN}✅${RESET} ${label} - used ${used}, local quota gate disabled"
    else
        echo -e "${GREEN}✅${RESET} ${label} - used ${used}/${limit}, remaining ${remaining}"
    fi


    echo "────────────────────────────────────────"
}

test_all_providers() {
    local test_prompt="Write a brief hello message."
    local test_system="You are a helpful assistant."
    local model_name

    echo "🧪 Testing configured providers..."

    # glm-main
    if ! codefast_has_api_key; then
        echo "Skipping glm-main: no API key"
    elif codefast_provider_is_exhausted "glm-main"; then
        echo "Skipping glm-main: locally marked unavailable (quota gate enabled)"
    else
        model_name="$(codefast_text_provider_model "glm-main" "general")"
        printf 'Testing glm-main (%s): ' "$model_name"
        if call_text_provider "glm-main" "$model_name" "$test_prompt" "$test_system" "0.2" "64" "1" >/dev/null 2>&1; then
            echo -e "${GREEN}OK${RESET}"
        else
            echo -e "${RED}FAILED${RESET}"
        fi
    fi

}

estimate_book_cost() {
    local num_chapters="${1:-12}"
    local words_per_chapter="${2:-2200}"

    echo "📘 GLM-5.1 Book Generation Estimate"
    echo "   Chapters: $num_chapters"
    echo "   Words per chapter: $words_per_chapter"
    echo "   Total words: $((num_chapters * words_per_chapter))"
    echo ""
    echo "   Requests go directly to GLM-5.1 (no local daily quota gate by default)."
    echo "   Active: GLM-5.1"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    case "${1:-}" in
        test)
            setup_multi_provider_system
            test_all_providers
            show_provider_status
            ;;
        status)
            setup_multi_provider_system
            show_provider_status
            ;;
        estimate)
            estimate_book_cost "${2:-12}" "${3:-2200}"
            ;;
        *)
            echo "GLM-5.1 AI System"
            echo ""
            echo "Usage:"
            echo "  $0 test"
            echo "  $0 status"
            echo "  $0 estimate [chapters] [words]"
            echo ""
            echo "This script is intended to be sourced by the book generator workflow."
            ;;
    esac
}

if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
