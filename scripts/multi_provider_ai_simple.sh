#!/usr/bin/env bash

# Claude + GLM + Vertex API system for book generation.

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

sanitize_request_timeout() {
    local value="${1:-$CODEFAST_CURL_MAX_TIME}"
    if ! [[ "$value" =~ ^[0-9]+$ ]] || [ "$value" -le 0 ]; then
        echo "$CODEFAST_CURL_MAX_TIME"
        return 0
    fi
    echo "$value"
}

sanitize_min_words_floor() {
    local value="${1:-0}"
    if ! [[ "$value" =~ ^[0-9]+$ ]] || [ "$value" -lt 0 ]; then
        echo "0"
        return 0
    fi
    echo "$value"
}

count_generated_words() {
    printf '%s' "$1" | wc -w | tr -d ' '
}

has_any_smart_provider() {
    local provider_id=""
    while IFS= read -r provider_id; do
        [ -n "$provider_id" ] || continue
        if provider_has_credentials "$provider_id"; then
            return 0
        fi
    done < <(build_provider_sequence)
    return 1
}

provider_has_credentials() {
    local provider_id="$1"
    case "$provider_id" in
        claude-main)
            codefast_has_api_key
            ;;
        glm-main)
            codefast_has_api_key
            ;;
        vertex-main)
            codefast_has_vertex_api_key
            ;;
        *)
            return 1
            ;;
    esac
}

setup_multi_provider_system() {
    mkdir -p "$CODEFAST_LOG_DIR"

    echo "🔧 Initializing Claude + GLM + Vertex API system..."
    echo "   Text order: $(codefast_text_provider_order general)"
    echo "   Cover order: $(codefast_cover_provider_order)"
    if codefast_has_api_key; then
        echo "✅ Codefast key detected (Claude/GLM)"
    else
        echo "⚠️  Codefast key not found"
    fi
    if codefast_has_vertex_api_key; then
        echo "✅ Vertex API key detected"
    else
        echo "⚠️  Vertex API key not found"
    fi

    return 0
}

extract_response_text() {
    printf '%s' "$1" | jq -r '
        [
            .output_text,
            ([.output[]?.content[]? | select((.type // "") == "output_text" or (.type // "") == "text") | (.text // "")] | join("")),
            ([.candidates[0].content.parts[]? | (.text // "")] | join("")),
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

compact_error_preview() {
    python3 -c 'import sys
text = sys.stdin.read().replace("\r", " ").replace("\n", " ")
text = " ".join(text.split())
sys.stdout.write(text[:240])'
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
        local error_preview
        error_preview="$(printf '%s' "$response" | compact_error_preview)"
        if [ -n "$error_preview" ]; then
            echo "⚠️ $(codefast_provider_label "$provider_id") upstream rate/limit response detected (HTTP $http_code): $error_preview" >&2
        else
            echo "⚠️ $(codefast_provider_label "$provider_id") upstream rate/limit response detected (HTTP $http_code)" >&2
        fi
    else
        local error_message
        error_message="$(extract_error_message "$response")"
        if [ -z "$error_message" ]; then
            error_message="$(printf '%s' "$response" | compact_error_preview)"
        fi
        echo "❌ $(codefast_provider_label "$provider_id") error (HTTP $http_code): $error_message" >&2
    fi
    return 1
}

build_vertex_generate_content_url() {
    local model="$1"
    local api_key
    local project_id
    local location

    api_key="$(resolve_vertex_api_key 2>/dev/null || true)"
    project_id="$(resolve_vertex_project_id 2>/dev/null || true)"
    location="$(resolve_vertex_location 2>/dev/null || true)"
    [ -n "$location" ] || location="us-central1"

    if [ -n "$project_id" ]; then
        printf 'https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent?key=%s\n' \
            "$location" "$project_id" "$location" "$model" "$api_key"
    else
        printf 'https://aiplatform.googleapis.com/v1/publishers/google/models/%s:generateContent?key=%s\n' \
            "$model" "$api_key"
    fi
}

call_vertex_gemini_provider() {
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

    api_key="$(resolve_vertex_api_key 2>/dev/null || true)"
    [ -n "$api_key" ] || return 1

    url="$(build_vertex_generate_content_url "$model")"
    payload="$(jq -nc \
        --arg system "$system_prompt" \
        --arg prompt "$prompt" \
        --argjson temperature "$temperature" \
        --argjson max_tokens "$max_tokens" \
        '{
            systemInstruction: {
                role: "system",
                parts: [{ text: $system }]
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: $prompt }]
                }
            ],
            generationConfig: {
                temperature: $temperature,
                maxOutputTokens: $max_tokens
            }
        }')"

    result="$(run_json_request "POST" "$url" "$payload" \
        -H "Content-Type: application/json")"
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
        local error_preview
        error_preview="$(printf '%s' "$response" | compact_error_preview)"
        if [ -n "$error_preview" ]; then
            echo "⚠️ $(codefast_provider_label "$provider_id") upstream rate/limit response detected (HTTP $http_code): $error_preview" >&2
        else
            echo "⚠️ $(codefast_provider_label "$provider_id") upstream rate/limit response detected (HTTP $http_code)" >&2
        fi
    else
        local error_message
        error_message="$(extract_error_message "$response")"
        if [ -z "$error_message" ]; then
            error_message="$(printf '%s' "$response" | compact_error_preview)"
        fi
        echo "❌ $(codefast_provider_label "$provider_id") error (HTTP $http_code): $error_message" >&2
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
        vertex_gemini)
            call_vertex_gemini_provider "$provider_id" "$model" "$prompt" "$system_prompt" "$temperature" "$max_tokens"
            ;;
        *)
            return 1
            ;;
    esac
}


# ============================================================================
build_provider_sequence() {
    local configured_order=""
    local provider_id=""
    local seen=" "

    configured_order="$(codefast_text_provider_order)"
    if [ -z "${configured_order// /}" ]; then
        configured_order="$(codefast_text_provider_ids | tr '\n' ' ')"
    fi

    for provider_id in $configured_order; do
        case "$provider_id" in
            claude-main|glm-main|vertex-main)
                if [[ "$seen" != *" ${provider_id} "* ]]; then
                    printf '%s\n' "$provider_id"
                    seen="${seen}${provider_id} "
                fi
                ;;
            *)
                ;;
        esac
    done
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
    local min_words_floor
    local request_timeout_seconds
    local fast_failover
    local provider_id
    local provider_label
    local model_name
    local fallback_model_name
    local candidate_model
    local candidate_models=()
    local generated_word_count
    local result
    local attempt
    local retry_delay
    local attempted_provider=0

    temperature="$(sanitize_temperature "${4:-0.7}")"
    max_tokens="$(sanitize_max_tokens "${5:-4096}")"
    max_retries="${6:-2}"
    min_words_floor="$(sanitize_min_words_floor "${7:-0}")"
    request_timeout_seconds="$(sanitize_request_timeout "${8:-$CODEFAST_CURL_MAX_TIME}")"
    fast_failover="${9:-0}"
    case "$fast_failover" in
        1|true|TRUE|yes|YES|on|ON)
            fast_failover=1
            ;;
        *)
            fast_failover=0
            ;;
    esac
    if ! [[ "$max_retries" =~ ^[0-9]+$ ]] || [ "$max_retries" -lt 1 ]; then
        max_retries=1
    fi
    if [ "$fast_failover" -eq 1 ] && [ "$max_retries" -gt 1 ]; then
        max_retries=1
    fi
    local CODEFAST_CURL_MAX_TIME="$request_timeout_seconds"
    retry_delay="${SMART_API_RETRY_BASE_DELAY_SECONDS:-6}"
    if ! [[ "$retry_delay" =~ ^[0-9]+$ ]] || [ "$retry_delay" -lt 1 ]; then
        retry_delay=6
    fi
    if [ "$fast_failover" -eq 1 ]; then
        retry_delay=1
    fi

    if ! has_any_smart_provider; then
        echo "No configured text provider credentials found (Claude, GLM or Vertex)." >&2
        return 1
    fi

    while IFS= read -r provider_id; do
        [ -n "$provider_id" ] || continue
        attempted_provider=1
        provider_label="$(codefast_provider_label "$provider_id")"

        if codefast_provider_is_exhausted "$provider_id"; then
            echo "⏭️ Skipping ${provider_label}: locally marked unavailable" >&2
            continue
        fi
        if ! provider_has_credentials "$provider_id"; then
            echo "⏭️ Skipping ${provider_label}: missing credentials" >&2
            continue
        fi

        candidate_models=()
        model_name="$(codefast_text_provider_model "$provider_id" "$task_type")"
        fallback_model_name="$(codefast_text_provider_fallback_model "$provider_id" "$task_type")"
        [ -n "$model_name" ] && candidate_models+=("$model_name")
        if [ "$fast_failover" -ne 1 ] && [ -n "$fallback_model_name" ] && [ "$fallback_model_name" != "$model_name" ]; then
            candidate_models+=("$fallback_model_name")
        fi
        if [ "${#candidate_models[@]}" -eq 0 ]; then
            echo "⏭️ Skipping ${provider_label}: no model configured for task '${task_type}'" >&2
            continue
        fi

        for candidate_model in "${candidate_models[@]}"; do
            retry_delay="${SMART_API_RETRY_BASE_DELAY_SECONDS:-6}"
            if ! [[ "$retry_delay" =~ ^[0-9]+$ ]] || [ "$retry_delay" -lt 1 ]; then
                retry_delay=6
            fi
            if [ "$fast_failover" -eq 1 ]; then
                retry_delay=1
            fi
            for ((attempt = 1; attempt <= max_retries; attempt += 1)); do
                echo "Using ${provider_label} (model: ${candidate_model}, task: ${task_type}) [attempt ${attempt}/${max_retries}]" >&2
                if result="$(call_text_provider "$provider_id" "$candidate_model" "$prompt" "$system_prompt" "$temperature" "$max_tokens" "$max_retries" 2> >(cat >&2))"; then
                    generated_word_count="$(count_generated_words "$result")"
                    if [ "$min_words_floor" -gt 0 ] && [ "$generated_word_count" -lt "$min_words_floor" ]; then
                        echo "⚠️ ${provider_label} response too short for task '${task_type}' (${generated_word_count} words, expected at least ${min_words_floor}); retrying/falling back." >&2
                    else
                        printf '%s\n' "$result"
                        return 0
                    fi
                fi
                if [ "$attempt" -lt "$max_retries" ]; then
                    sleep "$retry_delay"
                    retry_delay=$((retry_delay * 2))
                fi
            done
        done
    done < <(build_provider_sequence)

    if [ "$attempted_provider" -eq 0 ]; then
        echo "No valid text providers configured in CODEFAST_TEXT_PROVIDER_ORDER." >&2
        return 1
    fi
    echo "All configured text providers failed for task '${task_type}' after ${max_retries} attempts per model candidate" >&2
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

Create detailed book outlines that will guide the generation of roughly 22,000-26,000 word books.
Prefer 10-12 chapters with practical momentum, usually targeting about 2,200-2,600 words per chapter.

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
- 10-12 chapters with descriptive titles
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
    local chapter_max_tokens="${BOOK_CHAPTER_MAX_TOKENS:-5200}"
    local chapter_max_retries="${BOOK_CHAPTER_MAX_RETRIES:-5}"

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

    local variation_mode="${BOOK_VARIATION_MODE:-${VARIATION_MODE:-controlled}}"
    local book_profile="${BOOK_PROFILE:-nonfiction_premium}"
    local chapter_num_int=$((10#$chapter_num))
    local template_selector=$(( (chapter_num_int % 5) + 1 ))
    local structural_template=""

    case "${variation_mode}" in
        high_random)
            structural_template="Use a varied structure for this chapter. Mix explanatory narrative, worked examples, and short reflection prompts. Avoid repeating openings like 'In this chapter'."
            ;;
        fixed_classic)
            structural_template="Use a classical textbook structure: short hook, clear framework, examples, and concise summary bridge."
            ;;
        *)
            case "$template_selector" in
                1) structural_template="Template A: Start with a real-world scene, extract a principle, then present a repeatable framework and practical checklist." ;;
                2) structural_template="Template B: Start with a common mistake, explain why it happens, then provide a corrective method with before/after examples." ;;
                3) structural_template="Template C: Start with a surprising insight, break it into 3 mechanisms, and close each mechanism with one practical action." ;;
                4) structural_template="Template D: Start with a reader question, answer progressively with layered examples, and synthesize into a field guide." ;;
                *) structural_template="Template E: Start with a concise thesis, stress-test it with counterexamples, then provide a pragmatic playbook." ;;
            esac
            ;;
    esac

    local profile_directive=""
    case "$book_profile" in
        fiction_focused)
            profile_directive="Prioritize scene continuity, character intent, and sensory detail while keeping the narrative progression coherent."
            ;;
        hybrid_general)
            profile_directive="Blend practical explanation with story-led examples so each section adds either insight or momentum."
            ;;
        *)
            profile_directive="For nonfiction premium style: include clear subheadings, applied examples, and action-oriented transitions."
            ;;
    esac

    local system_prompt="You are a professional author writing a high-quality book. Write in ${style} style with ${tone} tone. Ensure content is original, engaging, and valuable to readers. The output language must be ${language}. Return only the chapter body in ${language}; do not add a heading line like '${chapter_label} ${chapter_num}: ${chapter_title}'. Avoid cliche meta-openers such as 'In this chapter', 'we will explore', or similar repetitive scaffolding."
    local chapter_word_floor=$(( min_words * 60 / 100 ))
    if [ "$chapter_word_floor" -lt 900 ]; then
        chapter_word_floor=900
    fi

    local user_prompt="Write ${chapter_label} ${chapter_num} for this book.
Target language: ${language}
Section title: ${chapter_title}

Book Outline Context:
${outline}

Previous Chapters (for continuity):
${existing_chapters}

Requirements:
- Write ${min_words}-${max_words} words
- Use the continuity packet to carry forward promises, transitions, and unresolved points without repeating earlier sections
- Make it engaging and informative
- Ensure smooth transitions and flow
- Include practical examples where appropriate
- Maintain consistency with previous chapters
- Write in ${style} style with ${tone} tone
- Write fully in ${language}
- Default to chapter length that can realistically land near the upper half of the requested range
- Insert meaningful subheadings to break long passages (roughly every 350-700 words for nonfiction)
- Keep paragraph rhythm natural; mix short, medium, and occasional long paragraphs
- Avoid repetitive chapter-intro cliches and avoid robotic transition phrases
- ${structural_template}
- ${profile_directive}
- Do not add a chapter heading, title line, or English label before the body

Begin writing the chapter body now:"

    smart_api_call "$user_prompt" "$system_prompt" "creative" 0.8 "$chapter_max_tokens" "$chapter_max_retries" "$chapter_word_floor"
}

chapter_segment_role_description() {
    local segment_index="$1"
    local segment_count="$2"
    case "${segment_count}:${segment_index}" in
        3:1) printf '%s\n' "Open the chapter strongly, frame the promise, and set up the central problem or idea." ;;
        3:2) printf '%s\n' "Develop the method, framework, or argument with practical depth and clear transitions." ;;
        3:3) printf '%s\n' "Turn the ideas into application, examples, and a satisfying bridge to the next chapter." ;;
        4:1) printf '%s\n' "Open the chapter strongly, frame the promise, and set up the main tension." ;;
        4:2) printf '%s\n' "Build the first half of the framework with explanation and examples." ;;
        4:3) printf '%s\n' "Deepen the framework with cases, contrasts, or practical use." ;;
        4:4) printf '%s\n' "Land the chapter with application, synthesis, and a forward transition." ;;
        *) printf '%s\n' "Continue the chapter with coherent progression, fresh material, and practical depth." ;;
    esac
}

generate_chapter_segment_with_smart_api() {
    local chapter_num="$1"
    local chapter_title="$2"
    local segment_index="$3"
    local segment_count="$4"
    local segment_context="$5"
    local continuity_packet="$6"
    local outline_context="$7"
    local chapter_summary="$8"
    local min_words="$9"
    local max_words="${10}"
    local style="${11}"
    local tone="${12}"
    local language="${13:-English}"
    local chapter_label="Chapter"
    local segment_role=""
    local segment_max_tokens="${BOOK_CHAPTER_SEGMENT_MAX_TOKENS:-2400}"
    local segment_max_retries="${BOOK_CHAPTER_SEGMENT_MAX_RETRIES:-4}"
    local segment_timeout_seconds="${BOOK_CHAPTER_SEGMENT_PROVIDER_TIMEOUT_SECONDS:-$CODEFAST_CURL_MAX_TIME}"
    local segment_fast_failover="${BOOK_CHAPTER_SEGMENT_FAST_FAILOVER:-1}"

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

    segment_role="$(chapter_segment_role_description "$segment_index" "$segment_count")"
    local segment_word_floor=$(( min_words * 60 / 100 ))
    if [ "$segment_word_floor" -lt 240 ]; then
        segment_word_floor=240
    fi

    local variation_mode="${BOOK_VARIATION_MODE:-${VARIATION_MODE:-controlled}}"
    local profile_directive=""
    case "${BOOK_PROFILE:-nonfiction_premium}" in
        fiction_focused)
            profile_directive="Maintain scene continuity and character-level causality."
            ;;
        hybrid_general)
            profile_directive="Balance narrative readability with practical transfer value."
            ;;
        *)
            profile_directive="Keep the segment practical, with concise subheadings and applicable examples."
            ;;
    esac

    local anti_repetition_directive="Do not begin with repetitive meta-phrases like 'In this chapter' or 'we will explore'."
    if [ "$variation_mode" = "fixed_classic" ]; then
        anti_repetition_directive="Keep transitions elegant and non-repetitive; avoid boilerplate openers."
    fi

    local system_prompt="You are a professional author assembling a long-form book in compact passes. Write only the requested segment body in ${language}. Keep the voice consistent, original, and practical. Do not add a heading like '${chapter_label} ${chapter_num}: ${chapter_title}'. ${anti_repetition_directive}"

    local user_prompt="Write segment ${segment_index}/${segment_count} for ${chapter_label} ${chapter_num}.
Target language: ${language}
Section title: ${chapter_title}

Segment mission:
${segment_role}

Chapter brief:
${chapter_summary}

Relevant outline context:
${outline_context}

Carry-forward continuity from previous chapters:
${continuity_packet}

Already written earlier in this same chapter:
${segment_context}

Requirements:
- Write ${min_words}-${max_words} words
- Continue naturally from the existing chapter material without repeating prior paragraphs
- Treat the existing chapter material as canonical; do not restart the chapter opening, reintroduce the same characters from scratch, or reset the scene/time if earlier segments already established them
- Add substantive material, not filler
- Use examples, explanation, and transitions where useful
- Keep terminology and promises consistent with earlier context
- If this is not the last segment, end with momentum rather than a full conclusion
- If this is the last segment, close the chapter cleanly and set up the next chapter subtly
- Write in ${style} style with ${tone} tone
- Return only the segment body in ${language}
- Do not add markdown headings, labels, or bullet metadata
- ${profile_directive}

Begin the segment body now:"

    smart_api_call \
        "$user_prompt" \
        "$system_prompt" \
        "chapter_segment" \
        0.75 \
        "$segment_max_tokens" \
        "$segment_max_retries" \
        "$segment_word_floor" \
        "$segment_timeout_seconds" \
        "$segment_fast_failover"
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
    local provider_id
    local label
    local used
    local limit
    local remaining
    local reason
    local found_provider=0

    echo -e "\n${CYAN}📊 Provider Status${RESET}"
    echo "────────────────────────────────────────"

    while IFS= read -r provider_id; do
        [ -n "$provider_id" ] || continue
        found_provider=1
        label="$(codefast_provider_label "$provider_id")"
        used="$(codefast_provider_usage_count "$provider_id")"
        limit="$(codefast_provider_daily_limit "$provider_id")"
        remaining="$(codefast_provider_remaining "$provider_id")"
        reason="$(codefast_provider_exhausted_reason "$provider_id")"

        if ! provider_has_credentials "$provider_id"; then
            echo -e "${RED}❌${RESET} ${label} - missing credentials"
        elif codefast_provider_is_exhausted "$provider_id"; then
            echo -e "${YELLOW}⏳${RESET} ${label} - exhausted (${used}/${limit}) ${reason}"
        elif [ "$limit" -le 0 ]; then
            echo -e "${GREEN}✅${RESET} ${label} - used ${used}, local quota gate disabled"
        else
            echo -e "${GREEN}✅${RESET} ${label} - used ${used}/${limit}, remaining ${remaining}"
        fi
    done < <(build_provider_sequence)

    if [ "$found_provider" -eq 0 ]; then
        echo -e "${YELLOW}⚠️${RESET} No text providers configured."
    fi
    echo "────────────────────────────────────────"
}

test_all_providers() {
    local test_prompt="Write a brief hello message."
    local test_system="You are a helpful assistant."
    local provider_id
    local label
    local model_name

    echo "🧪 Testing configured providers..."

    while IFS= read -r provider_id; do
        [ -n "$provider_id" ] || continue
        label="$(codefast_provider_label "$provider_id")"
        if ! provider_has_credentials "$provider_id"; then
            echo "Skipping ${provider_id}: missing credentials"
            continue
        fi
        if codefast_provider_is_exhausted "$provider_id"; then
            echo "Skipping ${provider_id}: locally marked unavailable (quota gate enabled)"
            continue
        fi
        model_name="$(codefast_text_provider_model "$provider_id" "general")"
        if [ -z "$model_name" ]; then
            echo "Skipping ${provider_id}: no model configured"
            continue
        fi
        printf 'Testing %s (%s): ' "$label" "$model_name"
        if call_text_provider "$provider_id" "$model_name" "$test_prompt" "$test_system" "0.2" "64" "1" >/dev/null 2>&1; then
            echo -e "${GREEN}OK${RESET}"
        else
            echo -e "${RED}FAILED${RESET}"
        fi
    done < <(build_provider_sequence)

}

estimate_book_cost() {
    local num_chapters="${1:-12}"
    local words_per_chapter="${2:-2200}"
    local active_order

    active_order="$(build_provider_sequence | tr '\n' ' ' | sed 's/  */ /g; s/^ //; s/ $//')"

    echo "📘 Book Generation Estimate"
    echo "   Chapters: $num_chapters"
    echo "   Words per chapter: $words_per_chapter"
    echo "   Total words: $((num_chapters * words_per_chapter))"
    echo ""
    echo "   Provider order: ${active_order:-none}"
    echo "   Notes:"
    echo "   - Primary should be Claude Sonnet 4.6."
    echo "   - First fallback should be GLM."
    echo "   - Last fallback should be Vertex Gemini 2.5 Flash-Lite."
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
            echo "Claude + GLM + Vertex AI System"
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
