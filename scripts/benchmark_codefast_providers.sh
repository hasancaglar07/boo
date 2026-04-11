#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT_DIR/book-generator-env.sh"
# shellcheck source=/dev/null
. "$SCRIPT_DIR/multi_provider_ai_simple.sh"

TITLE="Minecraft Oyun Rehberi"
DEFAULT_SUBTITLE="Hayatta Kalma, Ä°nÅŸa, Maden ve Macera Ä°Ã§in BaÅŸlangÄ±Ã§tan Ä°leri Seviyeye TÃ¼rkÃ§e Rehber"
DEFAULT_DESCRIPTION="Minecraft dÃ¼nyasÄ±na yeni giren ya da temel bilgilerini sistemli biÃ§imde gÃ¼Ã§lendirmek isteyen oyuncular iÃ§in hazÄ±rlanmÄ±ÅŸ TÃ¼rkÃ§e uygulama rehberi. Oyun akÄ±ÅŸÄ±nÄ± ilk geceden End ejderhasÄ±na, redstone mantÄ±ÄŸÄ±ndan Ã§ok oyunculu ipuÃ§larÄ±na kadar dÃ¼zenli ve anlaÅŸÄ±lÄ±r bir sÄ±rayla anlatÄ±r."
AUTHOR="${BENCHMARK_AUTHOR:-Benchmark Bot}"
PUBLISHER="${BENCHMARK_PUBLISHER:-Speedy Quick Publishing}"
PUBLICATION_YEAR="$(date +%Y)"
LANGUAGE="Turkish"
TEXT_TARGET_CHAPTERS="${BENCHMARK_TEXT_CHAPTERS:-6}"
TEXT_MIN_WORDS="${TEXT_MIN_WORDS:-950}"
TEXT_MAX_WORDS="${TEXT_MAX_WORDS:-1250}"
JUDGE_PROVIDER="${BENCHMARK_JUDGE_PROVIDER:-codex-main}"
JUDGE_TASK_TYPE="${BENCHMARK_JUDGE_TASK_TYPE:-analytical}"
OUTLINE_MAX_TOKENS="${BENCHMARK_OUTLINE_MAX_TOKENS:-2200}"
CHAPTER_MAX_TOKENS="${BENCHMARK_CHAPTER_MAX_TOKENS:-3200}"
JUDGE_MAX_TOKENS="${BENCHMARK_JUDGE_MAX_TOKENS:-1400}"
export CODEFAST_CURL_MAX_TIME="${BENCHMARK_CURL_MAX_TIME:-75}"
export COVER_VARIANT_ATTEMPTS="${BENCHMARK_COVER_VARIANTS:-3}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_ROOT="${1:-$ROOT_DIR/book_outputs/provider-benchmarks/minecraft-oyun-rehberi_${TIMESTAMP}}"
TEXT_ROOT="$OUTPUT_ROOT/text"
IMAGE_ROOT="$OUTPUT_ROOT/image"
REPORT_MD="$OUTPUT_ROOT/BENCHMARK_REPORT.md"
REPORT_JSON="$OUTPUT_ROOT/benchmark_report.json"
RUN_LOG="$OUTPUT_ROOT/benchmark_run.log"
CANONICAL_OUTLINE_JSON="$OUTPUT_ROOT/canonical_outline.json"

TEXT_PROVIDERS=(
    claude-main
    codex-main
    gemini-main
    glm-main
    qwen-main
    grok-main

    api5-open
    api3-chat
)

IMAGE_PROVIDERS=(

    nano-banana-pro
    nano-banana-2
)

if [ "${BENCHMARK_SKIP_TEXT:-0}" = "1" ]; then
    TEXT_PROVIDERS=()
elif [ -n "${BENCHMARK_TEXT_PROVIDERS:-}" ]; then
    read -r -a TEXT_PROVIDERS <<< "$BENCHMARK_TEXT_PROVIDERS"
fi

if [ "${BENCHMARK_SKIP_IMAGES:-0}" = "1" ]; then
    IMAGE_PROVIDERS=()
elif [ -n "${BENCHMARK_IMAGE_PROVIDERS:-}" ]; then
    read -r -a IMAGE_PROVIDERS <<< "$BENCHMARK_IMAGE_PROVIDERS"
fi

log() {
    local message="$1"
    printf '[%s] %s\n' "$(date +%H:%M:%S)" "$message" | tee -a "$RUN_LOG"
}

require_tools() {
    command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }
    command -v python3 >/dev/null 2>&1 || { echo "python3 is required" >&2; exit 1; }
    codefast_has_api_key || { echo "CODEFAST_API_KEY (or shared Codefast key) is required" >&2; exit 1; }
}

clean_llm_output() {
    printf '%s\n' "$1" | sed -e '1{/^```[a-zA-Z]*$/d;}' -e '${/^```$/d;}'
}

extract_json_payload() {
    local raw="$1"
    local tmp
    tmp="$(mktemp)"
    printf '%s\n' "$raw" > "$tmp"
    if grep -q '```json' "$tmp" 2>/dev/null; then
        sed -n '/```json/,/```/p' "$tmp" | sed '1d;$d'
    else
        cat "$tmp"
    fi
    rm -f "$tmp"
}

json_is_valid() {
    python3 - <<'PY' "$1" >/dev/null 2>&1
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
try:
    json.loads(path.read_text(encoding="utf-8"))
except Exception:
    raise SystemExit(1)
PY
}

build_canonical_outline() {
    jq -n \
        --arg title "$TITLE" \
        --arg subtitle "$DEFAULT_SUBTITLE" \
        --arg description "$DEFAULT_DESCRIPTION" \
        '{
            title: $title,
            subtitle: $subtitle,
            description: $description,
            chapters: [
                {
                    title: "Ä°lk DÃ¼nya, Ayarlar ve Ä°lk Gece",
                    summary: "Yeni bir dÃ¼nya aÃ§tÄ±ktan sonra en kritik ilk kararlarÄ±, temel ayarlarÄ± ve ilk geceyi gÃ¼venle atlatmak iÃ§in gereken adÄ±mlarÄ± anlatÄ±r."
                },
                {
                    title: "Kaynak Toplama, Crafting ve TaÅŸ Ã‡aÄŸÄ±na GeÃ§iÅŸ",
                    summary: "AÄŸaÃ§, taÅŸ, kÃ¶mÃ¼r ve yiyecek gibi temel kaynaklarÄ± verimli toplama yÃ¶ntemlerini ve ilk alet setini kurma mantÄ±ÄŸÄ±nÄ± aÃ§Ä±klar."
                },
                {
                    title: "BarÄ±nak, Maden ve Demir Ekipman DÃ¼zeni",
                    summary: "GÃ¼venli bir Ã¼s kurmayÄ±, maÄŸara ve maden disiplinini, fÄ±rÄ±n-demir dÃ¶ngÃ¼sÃ¼nÃ¼ ve Ã¶lmeden ilerleme alÄ±ÅŸkanlÄ±klarÄ±nÄ± iÅŸler."
                },
                {
                    title: "KÃ¶yler, Nether ve Orta Oyun Ä°lerlemesi",
                    summary: "KÃ¶y takasÄ±, enchantment hazÄ±rlÄ±ÄŸÄ±, Nether keÅŸfi ve oyunun orta safhasÄ±nda riskleri yÃ¶neterek gÃ¼Ã§lenme planÄ±nÄ± anlatÄ±r."
                },
                {
                    title: "End HazÄ±rlÄ±ÄŸÄ± ve Ejderha SavaÅŸÄ±",
                    summary: "End portalÄ± bulma, savaÅŸ Ã¶ncesi ekipman listesi, ejderha dÃ¶vÃ¼ÅŸÃ¼ ve savaÅŸ sonrasÄ± ilk hedefleri sistemli biÃ§imde sunar."
                },
                {
                    title: "Redstone, Ã‡iftlikler ve Uzun Vadeli GeliÅŸim",
                    summary: "Basit redstone mantÄ±ÄŸÄ±nÄ±, baÅŸlangÄ±Ã§ seviyesinde otomasyon kurmayÄ±, verimli Ã§iftlikleri ve Ã§ok oyunculu dÃ¼nyalarda dÃ¼zenli ilerlemeyi ele alÄ±r."
                }
            ]
        }'
}

write_metadata() {
    local target_dir="$1"
    local subtitle="$2"
    local description="$3"

    jq -n \
        --arg author "$AUTHOR" \
        --arg publisher "$PUBLISHER" \
        --arg description "$description" \
        --arg language "$LANGUAGE" \
        --arg year "$PUBLICATION_YEAR" \
        --arg subtitle "$subtitle" \
        '{
            author: $author,
            publisher: $publisher,
            description: $description,
            language: $language,
            year: $year,
            subtitle: $subtitle,
            generate_cover: false,
            fast: false
        }' > "$target_dir/dashboard_meta.json"
}

write_outline_markdown() {
    local json_file="$1"
    local output_file="$2"
    jq -r '
        [
            "# " + (.title // ""),
            "## " + (.subtitle // ""),
            "",
            (.chapters // [] | to_entries[] | "### BÃ¶lÃ¼m \(.key + 1): \(.value.title)")
        ] | join("\n")
    ' "$json_file" > "$output_file"
}

outline_context_for_prompt() {
    local json_file="$1"
    jq -r '.chapters | to_entries[] | "\(.key + 1). \(.value.title): \(.value.summary)"' "$json_file"
}

chapter_excerpt() {
    local file="$1"
    python3 - <<'PY' "$file"
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8", errors="replace")
print(text[:1800])
PY
}

count_english_leaks() {
    local provider_dir="$1"
    (
        rg -n '\bChapter\b|Table of Contents|^### By ' \
            "$provider_dir"/book_outline_final_*.md \
            "$provider_dir"/chapter_*_final.md \
            "$provider_dir"/manuscript_*.md 2>/dev/null || true
    ) | wc -l | tr -d ' '
}

render_outline_prompt() {
    cat <<EOF
Sen deneyimli bir oyun rehberi editÃ¶rÃ¼sÃ¼n. Sadece geÃ§erli JSON dÃ¶ndÃ¼r.

KitabÄ±n dili: TÃ¼rkÃ§e
Ana baÅŸlÄ±k sabit kalmalÄ±: ${TITLE}
Hedef okur: Oyuna yeni baÅŸlayan ve orta seviyeye geÃ§mek isteyen TÃ¼rkÃ§e konuÅŸan oyuncular

AÅŸaÄŸÄ±daki omurgaya sadÄ±k kalarak daha gÃ¼Ã§lÃ¼ bir satÄ±ÅŸ dili ve daha temiz bÃ¶lÃ¼m baÅŸlÄ±klarÄ± Ã¼ret:
1. Ä°lk dÃ¼nya, ayarlar ve ilk gece
2. Kaynak toplama, crafting ve taÅŸ araÃ§lara geÃ§iÅŸ
3. BarÄ±nak, maden ve demir ekipman dÃ¼zeni
4. KÃ¶yler, Nether ve orta oyun ilerlemesi
5. End hazÄ±rlÄ±ÄŸÄ± ve ejderha savaÅŸÄ±
6. Redstone, Ã§iftlikler ve uzun vadeli geliÅŸim

Åu JSON ÅŸemasÄ±nÄ± kullan:
{
  "title": "...",
  "subtitle": "...",
  "description": "...",
  "chapters": [
    {"title": "...", "summary": "..."}
  ]
}

Kurallar:
- title tam olarak "${TITLE}" olmalÄ±
- subtitle doÄŸal ve satÄ±ÅŸ odaklÄ± TÃ¼rkÃ§e olmalÄ±
- description 2 ya da 3 cÃ¼mle olmalÄ±
- tam olarak 6 chapter dÃ¶n
- chapter title ve summary alanlarÄ±nÄ±n tamamÄ± TÃ¼rkÃ§e olmalÄ±
- Ä°ngilizce chapter etiketi, "Chapter 1" gibi ifadeler bÄ±rakma
- sadece JSON dÃ¶ndÃ¼r
EOF
}

render_chapter_prompt() {
    local outline_file="$1"
    local chapter_number="$2"
    local chapter_title="$3"
    local chapter_summary="$4"
    local previous_context_file="$5"

    cat <<EOF
Minecraft iÃ§in profesyonel bir TÃ¼rkÃ§e oyun rehberi yazÄ±yorsun.

Kitap: ${TITLE}
Dil: TÃ¼rkÃ§e
Bu bÃ¶lÃ¼m numarasÄ±: ${chapter_number}
Bu bÃ¶lÃ¼m baÅŸlÄ±ÄŸÄ±: ${chapter_title}
Bu bÃ¶lÃ¼m hedefi: ${chapter_summary}

Kitap omurgasÄ±:
$(outline_context_for_prompt "$outline_file")

Ã–nceki bÃ¶lÃ¼mlerden baÄŸlam:
$(cat "$previous_context_file")

YazÄ±m kurallarÄ±:
- ${TEXT_MIN_WORDS}-${TEXT_MAX_WORDS} kelime aralÄ±ÄŸÄ±nda yaz
- sadece TÃ¼rkÃ§e yaz
- yeni baÅŸlayan okur iÃ§in aÃ§Ä±k, akÄ±cÄ± ve Ã¶ÄŸretici ol
- gerektiÄŸinde kÄ±sa madde listeleri kullan
- somut ipuÃ§larÄ±, sÄ±k yapÄ±lan hatalar ve uygulanabilir tavsiyeler ver
- "BÃ¶lÃ¼m ${chapter_number}:" gibi baÅŸlÄ±k satÄ±rÄ± ekleme; sadece bÃ¶lÃ¼m gÃ¶vdesini yaz
- Ä°ngilizce etiket, Ä°ngilizce bÃ¶lÃ¼m baÅŸlÄ±ÄŸÄ± veya meta aÃ§Ä±klama bÄ±rakma
- oyun terimlerinde doÄŸal TÃ¼rkÃ§e kullan, Ã§ok gerekli teknik terimler dÄ±ÅŸÄ±nda gereksiz Ä°ngilizceye kaÃ§ma
EOF
}

render_judge_prompt() {
    local outline_file="$1"
    local provider_dir="$2"

    cat <<EOF
Sen kÄ±demli bir TÃ¼rkÃ§e editÃ¶r ve oyun rehberi deÄŸerlendiricisisin. AÅŸaÄŸÄ±daki benchmark Ã§Ä±ktÄ±sÄ±nÄ± puanla ve sadece geÃ§erli JSON dÃ¶ndÃ¼r.

DeÄŸerlendirme Ã¶lÃ§Ã¼tleri:
- turkish_naturalness: TÃ¼rkÃ§e ne kadar doÄŸal?
- structural_consistency: BÃ¶lÃ¼mler birbiriyle ne kadar tutarlÄ±?
- beginner_usefulness: Yeni baÅŸlayan iÃ§in ne kadar faydalÄ±?
- actionability: AdÄ±mlar ve tavsiyeler ne kadar uygulanabilir?
- formatting_compliance: Ä°stenen format ve dil kurallarÄ±na ne kadar uyulmuÅŸ?
- overall: Genel kalite puanÄ±

JSON biÃ§imi:
{
  "scores": {
    "turkish_naturalness": 0,
    "structural_consistency": 0,
    "beginner_usefulness": 0,
    "actionability": 0,
    "formatting_compliance": 0,
    "overall": 0
  },
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "...", "..."],
  "verdict": "..."
}

Kurallar:
- TÃ¼m puanlar 1 ile 10 arasÄ±nda tam sayÄ± olsun
- strengths tam 3 madde olsun
- weaknesses tam 3 madde olsun
- verdict en fazla 3 cÃ¼mle olsun
- sadece JSON dÃ¶ndÃ¼r

Outline:
$(jq '.' "$outline_file")

Kitap Ã¶rnekleri:
$(for file in "$provider_dir"/chapter_*_final.md; do
    [ -f "$file" ] || continue
    printf '=== %s ===\n' "$(basename "$file")"
    chapter_excerpt "$file"
    printf '\n\n'
done)
EOF
}

append_previous_context() {
    local chapter_number="$1"
    local chapter_title="$2"
    local chapter_file="$3"
    local previous_context_file="$4"

    {
        printf 'BÃ¶lÃ¼m %s - %s\n' "$chapter_number" "$chapter_title"
        chapter_excerpt "$chapter_file"
        printf '\n\n'
    } >> "$previous_context_file"
}

generate_text_benchmark() {
    local provider_id="$1"
    local provider_label
    local outline_model
    local chapter_model
    local judge_model
    local provider_dir
    local research_dir
    local outline_raw_file
    local outline_json_candidate
    local working_outline_file
    local outline_md_file
    local chapters_jsonl
    local judge_raw_file
    local judge_json_file
    local previous_context_file
    local outline_prompt
    local outline_system
    local outline_raw=""
    local outline_stderr=""
    local outline_seconds=0
    local outline_ok=false
    local outline_valid=false
    local outline_used_canonical=false
    local total_words=0
    local chapter_success_count=0
    local compile_ok=false
    local compile_seconds=0
    local pdf_file=""
    local total_seconds=0
    local english_leaks=0
    local judge_ok=false
    local start_ts
    local end_ts

    provider_label="$(codefast_provider_label "$provider_id")"
    outline_model="$(codefast_text_provider_model "$provider_id" "outline")"
    chapter_model="$(codefast_text_provider_model "$provider_id" "creative")"
    judge_model="$(codefast_text_provider_model "$JUDGE_PROVIDER" "$JUDGE_TASK_TYPE")"
    provider_dir="$TEXT_ROOT/$provider_id"
    research_dir="$provider_dir/research/provider_benchmark"
    outline_raw_file="$research_dir/outline_raw.txt"
    outline_json_candidate="$research_dir/outline_candidate.json"
    working_outline_file="$research_dir/outline_working.json"
    outline_md_file="$provider_dir/book_outline_final_minecraft-oyun-rehberi.md"
    chapters_jsonl="$research_dir/chapters.jsonl"
    judge_raw_file="$research_dir/judge_raw.txt"
    judge_json_file="$research_dir/judge.json"
    previous_context_file="$research_dir/previous_context.txt"

    mkdir -p "$research_dir" "$provider_dir/assets" "$provider_dir/extras" "$provider_dir/research" "$provider_dir/sources" "$provider_dir/temp_refs" "$provider_dir/temp_appendices"
    : > "$chapters_jsonl"
    : > "$previous_context_file"

    log "Text benchmark basladi: $provider_id ($provider_label)"
    start_ts="$(date +%s)"

    outline_system="Sen deneyimli bir oyun rehberi editÃ¶rÃ¼sÃ¼n. Sadece geÃ§erli JSON dÃ¶ndÃ¼r."
    outline_prompt="$(render_outline_prompt)"
    outline_stderr="$research_dir/outline_stderr.log"
    local outline_start
    outline_start="$(date +%s)"
    if outline_raw="$(call_text_provider "$provider_id" "$outline_model" "$outline_prompt" "$outline_system" "0.4" "$OUTLINE_MAX_TOKENS" "1" 2>"$outline_stderr")"; then
        outline_ok=true
    else
        outline_ok=false
    fi
    outline_seconds=$(( $(date +%s) - outline_start ))
    printf '%s\n' "$outline_raw" > "$outline_raw_file"
    extract_json_payload "$outline_raw" > "$outline_json_candidate"
    if json_is_valid "$outline_json_candidate" && [ "$(jq '.chapters | length' "$outline_json_candidate")" -eq "$TEXT_TARGET_CHAPTERS" ]; then
        outline_valid=true
        jq --arg title "$TITLE" \
            --arg subtitle "$DEFAULT_SUBTITLE" \
            --arg description "$DEFAULT_DESCRIPTION" \
            '
            .title = $title
            | .subtitle = (if (.subtitle // "") == "" then $subtitle else .subtitle end)
            | .description = (if (.description // "") == "" then $description else .description end)
            ' "$outline_json_candidate" > "$working_outline_file"
    else
        outline_valid=false
        outline_used_canonical=true
        cp "$CANONICAL_OUTLINE_JSON" "$working_outline_file"
    fi

    write_outline_markdown "$working_outline_file" "$outline_md_file"
    write_metadata "$provider_dir" "$(jq -r '.subtitle // ""' "$working_outline_file")" "$(jq -r '.description // ""' "$working_outline_file")"

    local chapter_number
    for chapter_number in $(seq 1 "$TEXT_TARGET_CHAPTERS"); do
        local chapter_title
        local chapter_summary
        local chapter_prompt
        local chapter_system
        local chapter_raw=""
        local chapter_stderr_file
        local chapter_file
        local chapter_seconds
        local chapter_words
        local chapter_ok=false
        local chapter_start

        chapter_title="$(jq -r ".chapters[$((chapter_number - 1))].title // \"BÃ¶lÃ¼m ${chapter_number}\"" "$working_outline_file")"
        chapter_summary="$(jq -r ".chapters[$((chapter_number - 1))].summary // \"\"" "$working_outline_file")"
        chapter_prompt="$(render_chapter_prompt "$working_outline_file" "$chapter_number" "$chapter_title" "$chapter_summary" "$previous_context_file")"
        chapter_system="Sen profesyonel bir TÃ¼rkÃ§e oyun rehberi yazarÄ± ve editÃ¶rÃ¼sÃ¼n. Sadece bÃ¶lÃ¼m gÃ¶vdesini yaz."
        chapter_stderr_file="$research_dir/chapter_${chapter_number}_stderr.log"
        chapter_file="$provider_dir/chapter_${chapter_number}_final.md"
        chapter_start="$(date +%s)"
        if chapter_raw="$(call_text_provider "$provider_id" "$chapter_model" "$chapter_prompt" "$chapter_system" "0.6" "$CHAPTER_MAX_TOKENS" "1" 2>"$chapter_stderr_file")"; then
            chapter_ok=true
            printf '# BÃ¶lÃ¼m %s: %s\n\n%s\n' "$chapter_number" "$chapter_title" "$(clean_llm_output "$chapter_raw")" > "$chapter_file"
            chapter_success_count=$((chapter_success_count + 1))
            chapter_words="$(wc -w < "$chapter_file" | tr -d ' ')"
            total_words=$((total_words + chapter_words))
            append_previous_context "$chapter_number" "$chapter_title" "$chapter_file" "$previous_context_file"
        else
            chapter_ok=false
            chapter_words=0
            printf '# BÃ¶lÃ¼m %s: %s\n\nBu bÃ¶lÃ¼m benchmark sÄ±rasÄ±nda Ã¼retilemedi.\n' "$chapter_number" "$chapter_title" > "$chapter_file"
        fi
        chapter_seconds=$(( $(date +%s) - chapter_start ))
        jq -n \
            --argjson number "$chapter_number" \
            --arg title "$chapter_title" \
            --arg file "$chapter_file" \
            --argjson ok "$chapter_ok" \
            --argjson seconds "$chapter_seconds" \
            --argjson words "$chapter_words" \
            '{number: $number, title: $title, file: $file, ok: $ok, seconds: $seconds, words: $words}' >> "$chapters_jsonl"
    done

    local compile_log="$research_dir/compile.log"
    local compile_start
    compile_start="$(date +%s)"
    if bash "$ROOT_DIR/compile_book.sh" "$provider_dir" pdf 3 --author "$AUTHOR" --publisher "$PUBLISHER" --year "$PUBLICATION_YEAR" >"$compile_log" 2>&1; then
        compile_ok=true
    else
        compile_ok=false
    fi
    compile_seconds=$(( $(date +%s) - compile_start ))
    pdf_file="$(find "$provider_dir" -path '*/exports_*/*.pdf' -type f | sort | tail -1 || true)"
    [ -n "$pdf_file" ] || compile_ok=false

    local judge_prompt
    local judge_stderr="$research_dir/judge_stderr.log"
    local judge_raw=""
    judge_prompt="$(render_judge_prompt "$working_outline_file" "$provider_dir")"
    if judge_raw="$(call_text_provider "$JUDGE_PROVIDER" "$judge_model" "$judge_prompt" "Sen kÄ±demli bir TÃ¼rkÃ§e editÃ¶rsÃ¼n. Sadece geÃ§erli JSON dÃ¶ndÃ¼r." "0.2" "$JUDGE_MAX_TOKENS" "1" 2>"$judge_stderr")"; then
        printf '%s\n' "$judge_raw" > "$judge_raw_file"
        extract_json_payload "$judge_raw" > "$judge_json_file"
        if json_is_valid "$judge_json_file"; then
            judge_ok=true
        else
            judge_ok=false
        fi
    else
        judge_ok=false
        printf '%s\n' "$judge_raw" > "$judge_raw_file"
    fi

    english_leaks="$(count_english_leaks "$provider_dir")"
    end_ts="$(date +%s)"
    total_seconds=$((end_ts - start_ts))

    jq -n \
        --arg provider_id "$provider_id" \
        --arg provider_label "$provider_label" \
        --arg outline_model "$outline_model" \
        --arg chapter_model "$chapter_model" \
        --arg judge_provider "$JUDGE_PROVIDER" \
        --arg judge_model "$judge_model" \
        --arg provider_dir "$provider_dir" \
        --arg outline_file "$working_outline_file" \
        --arg outline_md_file "$outline_md_file" \
        --arg pdf_file "$pdf_file" \
        --arg chapters_jsonl "$chapters_jsonl" \
        --arg judge_json_file "$judge_json_file" \
        --arg judge_raw_file "$judge_raw_file" \
        --arg compile_log "$compile_log" \
        --argjson outline_ok "$outline_ok" \
        --argjson outline_valid "$outline_valid" \
        --argjson outline_used_canonical "$outline_used_canonical" \
        --argjson outline_seconds "$outline_seconds" \
        --argjson chapter_success_count "$chapter_success_count" \
        --argjson chapter_target "$TEXT_TARGET_CHAPTERS" \
        --argjson total_words "$total_words" \
        --argjson compile_ok "$compile_ok" \
        --argjson compile_seconds "$compile_seconds" \
        --argjson english_leaks "$english_leaks" \
        --argjson judge_ok "$judge_ok" \
        --argjson total_seconds "$total_seconds" \
        '{
            provider_id: $provider_id,
            provider_label: $provider_label,
            outline_model: $outline_model,
            chapter_model: $chapter_model,
            judge_provider: $judge_provider,
            judge_model: $judge_model,
            provider_dir: $provider_dir,
            outline_file: $outline_file,
            outline_markdown_file: $outline_md_file,
            pdf_file: $pdf_file,
            chapters_jsonl: $chapters_jsonl,
            judge_json_file: $judge_json_file,
            judge_raw_file: $judge_raw_file,
            compile_log: $compile_log,
            outline_ok: $outline_ok,
            outline_valid_json: $outline_valid,
            outline_used_canonical: $outline_used_canonical,
            outline_seconds: $outline_seconds,
            chapter_success_count: $chapter_success_count,
            chapter_target: $chapter_target,
            total_words: $total_words,
            compile_ok: $compile_ok,
            compile_seconds: $compile_seconds,
            english_leaks: $english_leaks,
            judge_ok: $judge_ok,
            total_seconds: $total_seconds
        }' > "$provider_dir/benchmark_result.json"

    log "Text benchmark bitti: $provider_id | chapter_success=${chapter_success_count}/${TEXT_TARGET_CHAPTERS} | pdf=$compile_ok | leaks=$english_leaks | total=${total_seconds}s"
}

generate_image_benchmark() {
    local provider_id="$1"
    local provider_dir="$IMAGE_ROOT/$provider_id"
    local config_file="$provider_dir/.cover-config.json"
    local run_stdout="$provider_dir/generate.log"
    local total_seconds=0
    local front_quality_file=""
    local back_quality_file=""
    local front_score=0
    local back_score=0
    local front_cover=""
    local back_cover=""
    local ok=false
    local provider_label
    local start_ts
    local end_ts

    provider_label="$provider_id"
    mkdir -p "$provider_dir"

    jq -n \
        --arg service "$provider_id" \
        --arg title "$TITLE" \
        --arg subtitle "$DEFAULT_SUBTITLE" \
        --arg author "$AUTHOR" \
        --arg genre "gaming how-to" \
        --arg theme_summary "$DEFAULT_DESCRIPTION" \
        --arg back_cover_blurb "$DEFAULT_DESCRIPTION" \
        --arg publisher_name "$PUBLISHER" \
        --arg publication_year "$PUBLICATION_YEAR" \
        --arg label_line "Minecraft â€¢ Hayatta Kalma â€¢ Ä°nÅŸa â€¢ Macera" \
        '{
            service: $service,
            book_title: $title,
            book_subtitle: $subtitle,
            author_name: $author,
            genre: $genre,
            theme_summary: $theme_summary,
            back_cover_blurb: $back_cover_blurb,
            publisher_name: $publisher_name,
            publication_year: $publication_year,
            label_line: $label_line
        }' > "$config_file"

    log "Image benchmark basladi: $provider_id"
    start_ts="$(date +%s)"
    if BOOK_COVER_CONFIG_FILE="$config_file" \
        BOOK_COVERS_DIR="$provider_dir" \
        BOOK_COVER_SERVICE="$provider_id" \
        bash "$SCRIPT_DIR/generate_covers.sh" --generate >"$run_stdout" 2>&1; then
        ok=true
    else
        ok=false
    fi
    end_ts="$(date +%s)"
    total_seconds=$((end_ts - start_ts))

    front_quality_file="$(find "$provider_dir/front" -type f -name '*_quality.json' | sort | tail -1 || true)"
    back_quality_file="$(find "$provider_dir/back" -type f -name '*_quality.json' | sort | tail -1 || true)"
    front_cover="$(find "$provider_dir/front" -type f \( -name '*_front_cover.png' -o -name '*_front_cover.jpg' \) | sort | tail -1 || true)"
    back_cover="$(find "$provider_dir/back" -type f \( -name '*_back_cover.png' -o -name '*_back_cover.jpg' \) | sort | tail -1 || true)"

    if [ -n "$front_quality_file" ] && json_is_valid "$front_quality_file"; then
        front_score="$(jq '.score // 0' "$front_quality_file")"
    fi
    if [ -n "$back_quality_file" ] && json_is_valid "$back_quality_file"; then
        back_score="$(jq '.score // 0' "$back_quality_file")"
    fi

    jq -n \
        --arg provider_id "$provider_id" \
        --arg provider_label "$provider_label" \
        --arg provider_dir "$provider_dir" \
        --arg front_quality_file "$front_quality_file" \
        --arg back_quality_file "$back_quality_file" \
        --arg front_cover "$front_cover" \
        --arg back_cover "$back_cover" \
        --arg run_stdout "$run_stdout" \
        --argjson ok "$ok" \
        --argjson total_seconds "$total_seconds" \
        --argjson front_score "$front_score" \
        --argjson back_score "$back_score" \
        '{
            provider_id: $provider_id,
            provider_label: $provider_label,
            provider_dir: $provider_dir,
            ok: $ok,
            total_seconds: $total_seconds,
            front_quality_file: $front_quality_file,
            back_quality_file: $back_quality_file,
            front_cover: $front_cover,
            back_cover: $back_cover,
            front_score: $front_score,
            back_score: $back_score,
            run_log: $run_stdout
        }' > "$provider_dir/benchmark_result.json"

    log "Image benchmark bitti: $provider_id | ok=$ok | front=${front_score} | back=${back_score} | total=${total_seconds}s"
}

build_report() {
    python3 - <<'PY' "$OUTPUT_ROOT" "$REPORT_MD" "$REPORT_JSON"
import json
import pathlib
import statistics
import sys

root = pathlib.Path(sys.argv[1])
report_md = pathlib.Path(sys.argv[2])
report_json = pathlib.Path(sys.argv[3])

text_results = []
for path in sorted((root / "text").glob("*/benchmark_result.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    judge_path = pathlib.Path(data.get("judge_json_file") or "")
    chapters_path = pathlib.Path(data.get("chapters_jsonl") or "")
    if judge_path.is_file():
        try:
            data["judge"] = json.loads(judge_path.read_text(encoding="utf-8"))
        except Exception:
            data["judge"] = {}
    else:
        data["judge"] = {}
    chapters = []
    if chapters_path.is_file():
        raw_text = chapters_path.read_text(encoding="utf-8")
        decoder = json.JSONDecoder()
        index = 0
        length = len(raw_text)
        while index < length:
            while index < length and raw_text[index].isspace():
                index += 1
            if index >= length:
                break
            value, next_index = decoder.raw_decode(raw_text, index)
            chapters.append(value)
            index = next_index
    data["chapters"] = chapters
    text_results.append(data)

image_results = []
for path in sorted((root / "image").glob("*/benchmark_result.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    image_results.append(data)

def score_value(item, key):
    return float(item.get("judge", {}).get("scores", {}).get(key, 0) or 0)

successful_text = [item for item in text_results if item.get("chapter_success_count")]
text_times = [float(item.get("total_seconds", 0) or 0) for item in successful_text if float(item.get("total_seconds", 0) or 0) > 0]
min_text_time = min(text_times) if text_times else 0.0
max_text_time = max(text_times) if text_times else 0.0

for item in text_results:
    time_value = float(item.get("total_seconds", 0) or 0)
    if max_text_time > min_text_time:
        speed_score = 10.0 * (max_text_time - time_value) / (max_text_time - min_text_time)
    else:
        speed_score = 10.0 if time_value else 0.0
    completion_ratio = float(item.get("chapter_success_count", 0) or 0) / max(1.0, float(item.get("chapter_target", 6) or 6))
    completion_score = completion_ratio * 20.0
    if item.get("outline_valid_json"):
        completion_score += 6.0
    if item.get("compile_ok"):
        completion_score += 6.0
    judge_score = (
        score_value(item, "overall") * 4.5
        + score_value(item, "structural_consistency") * 1.8
        + score_value(item, "beginner_usefulness") * 1.6
        + score_value(item, "turkish_naturalness") * 1.4
        + score_value(item, "formatting_compliance") * 1.2
        + score_value(item, "actionability") * 1.0
    )
    penalties = float(item.get("english_leaks", 0) or 0) * 2.5
    if item.get("outline_used_canonical"):
        penalties += 4.0
    penalties += max(0.0, float(item.get("chapter_target", 6) or 6) - float(item.get("chapter_success_count", 0) or 0)) * 4.0
    composite = max(0.0, min(100.0, completion_score + judge_score + speed_score - penalties))
    item["composite_score"] = round(composite, 2)
    item["speed_score"] = round(speed_score, 2)

text_ranked = sorted(
    text_results,
    key=lambda item: (
        item.get("composite_score", 0),
        score_value(item, "overall"),
        -float(item.get("total_seconds", 0) or 0),
    ),
    reverse=True,
)

successful_image = [item for item in image_results if item.get("ok")]
image_times = [float(item.get("total_seconds", 0) or 0) for item in successful_image if float(item.get("total_seconds", 0) or 0) > 0]
min_image_time = min(image_times) if image_times else 0.0
max_image_time = max(image_times) if image_times else 0.0

for item in image_results:
    time_value = float(item.get("total_seconds", 0) or 0)
    if max_image_time > min_image_time:
        speed_score = 10.0 * (max_image_time - time_value) / (max_image_time - min_image_time)
    else:
        speed_score = 10.0 if time_value else 0.0
    avg_quality = statistics.mean([float(item.get("front_score", 0) or 0), float(item.get("back_score", 0) or 0)])
    penalties = 0.0 if item.get("ok") else 25.0
    composite = max(0.0, min(100.0, avg_quality + speed_score * 1.5 - penalties))
    item["average_quality"] = round(avg_quality, 2)
    item["speed_score"] = round(speed_score, 2)
    item["composite_score"] = round(composite, 2)

image_ranked = sorted(
    image_results,
    key=lambda item: (item.get("composite_score", 0), item.get("average_quality", 0)),
    reverse=True,
)

summary = {
    "text_ranking": text_ranked,
    "image_ranking": image_ranked,
    "recommended_text_fallback_order": [item["provider_id"] for item in text_ranked],
    "recommended_image_fallback_order": [item["provider_id"] for item in image_ranked],
}
report_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

lines = []
lines.append("# Minecraft Oyun Rehberi Benchmark")
lines.append("")
lines.append("## Ã–nerilen Text Fallback SÄ±rasÄ±")
lines.append("")
for index, item in enumerate(text_ranked, start=1):
    lines.append(
        f"{index}. `{item['provider_id']}` | skor `{item.get('composite_score', 0)}` | "
        f"genel `{score_value(item, 'overall')}` | bolum `{item.get('chapter_success_count', 0)}/{item.get('chapter_target', 6)}` | "
        f"sure `{item.get('total_seconds', 0)}s`"
    )
lines.append("")
lines.append("## Text SonuÃ§larÄ±")
lines.append("")
lines.append("| SÄ±ra | Provider | Toplam Skor | Genel | YapÄ± | TÃ¼rkÃ§e | Format | BÃ¶lÃ¼m | Kelime | SÄ±zÄ±ntÄ± | PDF | SÃ¼re | PDF |")
lines.append("| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- | ---: | --- |")
for index, item in enumerate(text_ranked, start=1):
    lines.append(
        "| {rank} | `{provider}` | {score:.2f} | {overall:.1f} | {structure:.1f} | {turkish:.1f} | {formatting:.1f} | {chapters}/{target} | {words} | {leaks} | {pdf_ok} | {seconds} | `{pdf}` |".format(
            rank=index,
            provider=item["provider_id"],
            score=float(item.get("composite_score", 0) or 0),
            overall=score_value(item, "overall"),
            structure=score_value(item, "structural_consistency"),
            turkish=score_value(item, "turkish_naturalness"),
            formatting=score_value(item, "formatting_compliance"),
            chapters=item.get("chapter_success_count", 0),
            target=item.get("chapter_target", 6),
            words=item.get("total_words", 0),
            leaks=item.get("english_leaks", 0),
            pdf_ok="evet" if item.get("compile_ok") else "hayÄ±r",
            seconds=item.get("total_seconds", 0),
            pdf=item.get("pdf_file", ""),
        )
    )
lines.append("")
lines.append("## Ã–nerilen Kapak Fallback SÄ±rasÄ±")
lines.append("")
for index, item in enumerate(image_ranked, start=1):
    lines.append(
        f"{index}. `{item['provider_id']}` | skor `{item.get('composite_score', 0)}` | "
        f"ortalama kalite `{item.get('average_quality', 0)}` | sure `{item.get('total_seconds', 0)}s`"
    )
lines.append("")
lines.append("## Image SonuÃ§larÄ±")
lines.append("")
lines.append("| SÄ±ra | Provider | Toplam Skor | Ã–n | Arka | Ortalama | SÃ¼re | Ã–n Kapak | Arka Kapak |")
lines.append("| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |")
for index, item in enumerate(image_ranked, start=1):
    lines.append(
        "| {rank} | `{provider}` | {score:.2f} | {front:.2f} | {back:.2f} | {avg:.2f} | {seconds} | `{front_cover}` | `{back_cover}` |".format(
            rank=index,
            provider=item["provider_id"],
            score=float(item.get("composite_score", 0) or 0),
            front=float(item.get("front_score", 0) or 0),
            back=float(item.get("back_score", 0) or 0),
            avg=float(item.get("average_quality", 0) or 0),
            seconds=item.get("total_seconds", 0),
            front_cover=item.get("front_cover", ""),
            back_cover=item.get("back_cover", ""),
        )
    )
lines.append("")
lines.append("## Notlar")
lines.append("")
lines.append("- Text benchmark iÃ§in her provider aynÄ± kitap baÅŸlÄ±ÄŸÄ±, aynÄ± bÃ¶lÃ¼m omurgasÄ± ve aynÄ± kelime aralÄ±ÄŸÄ±yla Ã§alÄ±ÅŸtÄ±rÄ±ldÄ±.")
lines.append("- Outline JSON baÅŸarÄ±sÄ±z olduÄŸunda benchmark devam edebilsin diye kanonik outline kullanÄ±ldÄ±; bu durum skora ceza olarak yansÄ±tÄ±ldÄ±.")
lines.append("- Image benchmark sadece statik kapak Ã¼retimi iÃ§in uygun servisleri kapsar; Veo 3.1 video odaklÄ± olduÄŸu iÃ§in bu sÄ±ralamaya alÄ±nmadÄ±.")

report_md.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY
}

main() {
    require_tools
    mkdir -p "$TEXT_ROOT" "$IMAGE_ROOT"
    touch "$RUN_LOG"
    build_canonical_outline > "$CANONICAL_OUTLINE_JSON"

    local provider_id
    for provider_id in "${TEXT_PROVIDERS[@]}"; do
        generate_text_benchmark "$provider_id"
    done

    for provider_id in "${IMAGE_PROVIDERS[@]}"; do
        generate_image_benchmark "$provider_id"
    done

    if [ "${BENCHMARK_SKIP_REPORT:-0}" = "1" ]; then
        log "Worker tamamlandi. Rapor olusturma atlandi."
        return 0
    fi

    build_report
    log "Benchmark tamamlandi. Rapor: $REPORT_MD"
}

main "$@"
