#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./book-generator-env.sh
source "$ROOT_DIR/book-generator-env.sh"

clean_llm_output() {
    printf '%s\n' "$1" | sed -e '1{/^```[a-zA-Z]*$/d;}' -e '${/^```$/d;}'
}

# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/multi_provider_ai_simple.sh"
# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/optimized_chapter_handler.sh"

find_outline_file() {
    local book_dir="$1"
    local file=""
    for pattern in "book_outline_final_"*.md "book_outline_"*.md "outline.md"; do
        for candidate in "$book_dir"/$pattern; do
            if [ -f "$candidate" ]; then
                echo "$candidate"
                return 0
            fi
        done
    done
    return 1
}

chapter_file_for() {
    local book_dir="$1"
    local chapter_num="$2"
    echo "$book_dir/chapter_${chapter_num}_final.md"
}

ensure_book_layout() {
    local book_dir="$1"
    mkdir -p \
        "$book_dir/assets" \
        "$book_dir/extras" \
        "$book_dir/research" \
        "$book_dir/sources" \
        "$book_dir/temp_refs" \
        "$book_dir/temp_appendices"
}

normalize_book_language() {
    local raw
    raw="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | sed 's/^ *//; s/ *$//')"
    case "$raw" in
        tr*|turkish|türkçe|turkce|turk)
            printf '%s\n' "Turkish"
            ;;
        en*|english|ingilizce)
            printf '%s\n' "English"
            ;;
        *)
            printf '%s\n' ""
            ;;
    esac
}

detect_book_language() {
    local sample="$*"
    local lowered
    local turkish_hits
    local english_hits

    if [ -z "${sample// /}" ]; then
        printf '%s\n' ""
        return 0
    fi

    if printf '%s' "$sample" | grep -qi '[çğıöşüÇĞİÖŞÜ]'; then
        printf '%s\n' "Turkish"
        return 0
    fi

    lowered="$(printf '%s' "$sample" | tr '[:upper:]' '[:lower:]')"
    turkish_hits="$(printf '%s' "$lowered" | grep -Eio '\b(ve|ile|için|icin|bu|bir|kitap|rehber|oyun|bölüm|bolum|başlangıç|baslangic|nasıl|nasil|neden|oyuncu|adım|adim)\b' | wc -l | tr -d ' ')"
    english_hits="$(printf '%s' "$lowered" | grep -Eio '\b(the|and|with|for|chapter|guide|book|game|player|step|tips|build|craft|survival)\b' | wc -l | tr -d ' ')"

    if [ "${turkish_hits:-0}" -gt "${english_hits:-0}" ]; then
        printf '%s\n' "Turkish"
    elif [ "${english_hits:-0}" -gt "${turkish_hits:-0}" ]; then
        printf '%s\n' "English"
    else
        printf '%s\n' ""
    fi
}

infer_book_language_for_dir() {
    local book_dir="$1"
    local meta_file="$book_dir/dashboard_meta.json"
    local raw=""
    local normalized=""
    local outline_file=""
    local sample=""
    local detected=""

    if [ -f "$meta_file" ]; then
        if command -v jq >/dev/null 2>&1; then
            raw="$(jq -r '.language // empty' "$meta_file" 2>/dev/null || true)"
        else
            raw="$(grep -Eo '"language"[[:space:]]*:[[:space:]]*"[^"]+"' "$meta_file" | head -n 1 | sed 's/.*"language"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || true)"
        fi
        normalized="$(normalize_book_language "$raw")"
        if [ -n "$normalized" ]; then
            printf '%s\n' "$normalized"
            return 0
        fi
    fi

    outline_file="$(find_outline_file "$book_dir" || true)"
    if [ -n "$outline_file" ] && [ -f "$outline_file" ]; then
        sample="$(sed -n '1,40p' "$outline_file")"
    fi

    if [ -z "${sample// /}" ]; then
        local first_chapter=""
        first_chapter="$(find "$book_dir" -maxdepth 1 -type f -name 'chapter_*_final.md' | sort -V | head -n 1 || true)"
        if [ -n "$first_chapter" ] && [ -f "$first_chapter" ]; then
            sample="$(sed -n '1,60p' "$first_chapter")"
        fi
    fi

    detected="$(detect_book_language "$sample")"
    if [ -n "$detected" ]; then
        printf '%s\n' "$detected"
    else
        printf '%s\n' "English"
    fi
}

chapter_label_for_language() {
    if [ "$(normalize_book_language "$1")" = "Turkish" ]; then
        printf '%s\n' "Bölüm"
    else
        printf '%s\n' "Chapter"
    fi
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

topic_suggest() {
    local niche="$1"
    local audience="${2:-general readers}"
    local category="${3:-non-fiction}"

    local system_prompt="You are a KDP strategist. Return valid JSON only."
    local user_prompt="Generate commercially promising book ideas.

Primary niche: ${niche}
Audience: ${audience}
Category: ${category}

Return JSON with this exact shape:
{
  \"topics\": [\"...\"],
  \"titles\": [
    {\"title\": \"...\", \"subtitle\": \"...\", \"description\": \"...\"}
  ]
}

Rules:
- 8 topic suggestions
- 6 title suggestions
- subtitles must be concrete
- descriptions max 2 sentences
- output JSON only"

    local raw
    raw="$(smart_api_call "$user_prompt" "$system_prompt" "creative" 0.7 4096 2 "${OLLAMA_PREFERRED_MODEL:-}")"
    extract_json_payload "$raw"
}

outline_json() {
    local topic="$1"
    local genre="$2"
    local audience="$3"
    local style="${4:-detailed}"
    local tone="${5:-professional}"
    local language
    language="$(normalize_book_language "${6:-}")"
    [ -n "$language" ] || language="English"

    local system_prompt="You are a professional KDP book strategist. Return valid JSON only."
    local user_prompt="Generate a commercially viable book plan.

Topic: ${topic}
Genre: ${genre}
Audience: ${audience}
Style: ${style}
Tone: ${tone}
Output language: ${language}

Return JSON with this exact shape:
{
  \"title\": \"...\",
  \"subtitle\": \"...\",
  \"description\": \"...\",
  \"chapters\": [
    {\"title\": \"...\", \"summary\": \"...\"}
  ]
}

Rules:
- 8 to 12 chapters
- chapters must be practical and specific
- summary values must be 2 sentences max
- title, subtitle, description, chapter titles, and summaries must all be written in ${language}
- if the language is Turkish, do not leave labels or headings in English
- output JSON only"

    local raw
    raw="$(smart_api_call "$user_prompt" "$system_prompt" "outline" 0.7 4096 2 "${OLLAMA_PREFERRED_MODEL:-}")"
    extract_json_payload "$raw"
}

chapter_generate() {
    local book_dir="$1"
    local chapter_num="$2"
    local chapter_title="$3"
    local min_words="$4"
    local max_words="$5"
    local style="${6:-clear}"
    local tone="${7:-professional}"
    local language
    language="$(normalize_book_language "${8:-}")"

    ensure_book_layout "$book_dir"
    [ -n "$language" ] || language="$(infer_book_language_for_dir "$book_dir")"
    local outline_file=""
    outline_file="$(find_outline_file "$book_dir" || true)"
    local outline_content=""
    [ -n "$outline_file" ] && outline_content="$(cat "$outline_file")"

    local existing_chapters=""
    local file
    for file in "$book_dir"/chapter_*_final.md; do
        [ -f "$file" ] || continue
        if [ "$file" = "$(chapter_file_for "$book_dir" "$chapter_num")" ]; then
            continue
        fi
        existing_chapters+=$'\n\n'
        existing_chapters+="== $(basename "$file") =="$'\n'
        existing_chapters+="$(cat "$file")"
    done

    local content
    content="$(generate_chapter_with_smart_api "$chapter_num" "$chapter_title" "$existing_chapters" "$outline_content" "$min_words" "$max_words" "$style" "$tone" "$language")"
    local chapter_path
    local chapter_label
    chapter_label="$(chapter_label_for_language "$language")"
    chapter_path="$(chapter_file_for "$book_dir" "$chapter_num")"
    printf '# %s %s: %s\n\n%s\n' "$chapter_label" "$chapter_num" "$chapter_title" "$(clean_llm_output "$content")" > "$chapter_path"
    echo "Saved chapter to $chapter_path"
}

chapter_plagiarism() {
    local book_dir="$1"
    local chapter_num="$2"
    local chapter_path
    chapter_path="$(chapter_file_for "$book_dir" "$chapter_num")"
    [ -f "$chapter_path" ] || { echo "Chapter not found: $chapter_path" >&2; exit 1; }

    local content
    content="$(cat "$chapter_path")"
    local prompt="Analyze this chapter for originality and plagiarism risk.

Return a markdown report with:
- ORIGINALITY_SCORE: x/10
- PLAGIARISM_RISK: low/medium/high
- COPYRIGHT_RISK: low/medium/high
- FLAGGED_SECTIONS
- RECOMMENDATIONS

Chapter:
${content}"

    local report
    report="$(smart_api_call "$prompt" "You are an originality analyst." "plagiarism_check" 0.2 4096 2 "${OLLAMA_PREFERRED_MODEL:-}")"
    local report_path="$book_dir/chapter_${chapter_num}_plagiarism_report.md"
    printf '%s\n' "$report" > "$report_path"
    echo "Saved plagiarism report to $report_path"
}

chapter_rewrite() {
    local book_dir="$1"
    local chapter_num="$2"
    local chapter_path
    chapter_path="$(chapter_file_for "$book_dir" "$chapter_num")"
    [ -f "$chapter_path" ] || { echo "Chapter not found: $chapter_path" >&2; exit 1; }

    local report_path="$book_dir/chapter_${chapter_num}_plagiarism_report.md"
    if [ ! -f "$report_path" ]; then
        chapter_plagiarism "$book_dir" "$chapter_num"
    fi
    rewrite_chapter_with_smart_api "$chapter_path" "$report_path"
    echo "Rewrote chapter: $chapter_path"
}

chapter_review() {
    local book_dir="$1"
    local chapter_num="$2"
    local chapter_path
    chapter_path="$(chapter_file_for "$book_dir" "$chapter_num")"
    [ -f "$chapter_path" ] || { echo "Chapter not found: $chapter_path" >&2; exit 1; }
    review_chapter_quality "$chapter_path"
}

chapter_extend() {
    local book_dir="$1"
    local chapter_num="$2"
    local min_words="${3:-2000}"
    local max_words="${4:-2500}"
    local chapter_path
    chapter_path="$(chapter_file_for "$book_dir" "$chapter_num")"
    [ -f "$chapter_path" ] || { echo "Chapter not found: $chapter_path" >&2; exit 1; }
    process_chapter_by_length "$chapter_path" "$min_words" "$max_words"
}

pick_imagemagick() {
    if command -v magick >/dev/null 2>&1; then
        echo "magick"
    else
        echo "convert"
    fi
}

generate_local_cover() {
    local book_dir="$1"
    local title="$2"
    local subtitle="${3:-}"
    local author="${4:-}"
    local blurb="${5:-}"

    ensure_book_layout "$book_dir"
    local assets_dir="$book_dir/assets"
    local front="$assets_dir/generated_front_cover.png"
    local back="$assets_dir/generated_back_cover.png"
    local font_regular
    local font_bold
    local image_tool
    image_tool="$(pick_imagemagick)"
    font_regular="$(fc-match -f '%{file}\n' 'DejaVu Sans' | head -n 1)"
    font_bold="$(fc-match -f '%{file}\n' 'DejaVu Sans Bold' | head -n 1)"
    [ -n "$font_regular" ] || font_regular="DejaVu-Sans"
    [ -n "$font_bold" ] || font_bold="$font_regular"
    [ -n "$blurb" ] || blurb="A professionally assembled draft generated from the Book Generator dashboard."

    "$image_tool" -size 1600x2560 gradient:'#1b2636-#a84628' \
        -fill '#f8f1e7' -font "$font_bold" -pointsize 120 -gravity north \
        -annotate +0+260 "$title" \
        -font "$font_regular" -pointsize 52 -annotate +0+470 "$subtitle" \
        -fill '#d6d8db' -font "$font_regular" -pointsize 44 -gravity south \
        -annotate +0+240 "$author" \
        "$front"

    "$image_tool" -size 1600x2560 gradient:'#f1eadf-#d7cec1' \
        -fill '#1f2324' -font "$font_bold" -pointsize 90 -gravity north \
        -annotate +0+180 "Back Cover" \
        -font "$font_regular" -pointsize 42 -gravity center \
        -size 1100x1400 caption:"$blurb" \
        -gravity center -composite \
        -fill '#4a4d50' -gravity south -pointsize 34 \
        -annotate +0+180 "Generated locally with ImageMagick" \
        "$back"

    echo "$front"
    echo "$back"
}

run_cover_script() {
    local book_dir="$1"
    local mode="${2:-generate}"
    local service="${3:-auto}"
    local username="${4:-}"
    local password="${5:-}"
    local title="${6:-}"
    local author="${7:-}"
    local genre="${8:-non-fiction}"
    local subtitle=""
    local theme_summary=""
    local back_cover_blurb=""
    local author_bio=""
    local publisher_name=""
    local publication_year=""
    local label_line=""
    local outline_file=""
    local subtitle_line=""
    local meta_file="$book_dir/dashboard_meta.json"

    ensure_book_layout "$book_dir"
    local runtime_dir="$book_dir/research/cover_automation"
    local covers_dir="$runtime_dir/generated"
    local config_path="$runtime_dir/.cover-config.json"
    mkdir -p "$runtime_dir" "$covers_dir"

    outline_file="$(find_outline_file "$book_dir" || true)"
    if [ -n "$outline_file" ]; then
        if [ -z "$title" ]; then
            title="$(sed -n '1p' "$outline_file" | sed 's/^# //; s/^BOOK TITLE:[[:space:]]*//; s/\r$//')"
        fi
        subtitle_line="$(sed -n '2p' "$outline_file" | sed 's/^## //; s/^SUBTITLE:[[:space:]]*//; s/\r$//')"
        subtitle="${subtitle_line#\# }"
        if [ -n "$subtitle" ] && printf '%s' "$title" | grep -q ': '; then
            title="${title%%:*}"
        fi
    fi

    if [ -f "$meta_file" ]; then
        if [ -z "$author" ]; then
            author="$(jq -r '.author // ""' "$meta_file")"
        fi
        theme_summary="$(jq -r '.description // ""' "$meta_file")"
        back_cover_blurb="$(jq -r '.back_cover_blurb // .description // ""' "$meta_file")"
        author_bio="$(jq -r '.author_bio // ""' "$meta_file")"
        publisher_name="$(jq -r '.publisher // ""' "$meta_file")"
        publication_year="$(jq -r '.year // ""' "$meta_file")"
        label_line="$(jq -r '.cover_label_line // ""' "$meta_file")"
    fi

    if [ -z "$author_bio" ] && [ -n "$author" ]; then
        author_bio="$author, bu kitap için içerik çerçevesi ve araştırma akışını oluşturan yazardır."
    fi
    if [ -z "$label_line" ] && [ -n "$subtitle" ]; then
        label_line="$(printf '%s' "$subtitle" | sed 's/ ve .*//' | sed 's/, / • /g')"
    fi

    jq -n \
        --arg service "$service" \
        --arg username "$username" \
        --arg password "$password" \
        --arg title "$title" \
        --arg subtitle "$subtitle" \
        --arg author "$author" \
        --arg genre "$genre" \
        --arg theme_summary "$theme_summary" \
        --arg back_cover_blurb "$back_cover_blurb" \
        --arg author_bio "$author_bio" \
        --arg publisher_name "$publisher_name" \
        --arg publication_year "$publication_year" \
        --arg label_line "$label_line" \
        '{
            service: $service,
            username: $username,
            password: $password,
            book_title: $title,
            book_subtitle: $subtitle,
            author_name: $author,
            genre: $genre,
            theme_summary: $theme_summary,
            back_cover_blurb: $back_cover_blurb,
            author_bio: $author_bio,
            publisher_name: $publisher_name,
            publication_year: $publication_year,
            label_line: $label_line
        }' > "$config_path"

    local flag="--generate"
    case "$mode" in
        front) flag="--front-only" ;;
        back) flag="--back-only" ;;
        generate|both) flag="--generate" ;;
        *) echo "Unsupported cover automation mode: $mode" >&2; exit 1 ;;
    esac

    BOOK_COVER_CONFIG_FILE="$config_path" \
    BOOK_COVERS_DIR="$covers_dir" \
    BOOK_COVER_SERVICE="$service" \
    bash "$ROOT_DIR/scripts/generate_covers.sh" "$flag"

    local copied=false
    local latest_front=""
    local latest_back=""
    latest_front="$(find "$covers_dir/front" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) 2>/dev/null | sort | tail -1 || true)"
    latest_back="$(find "$covers_dir/back" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) 2>/dev/null | sort | tail -1 || true)"

    if [ -n "$latest_front" ] && [ -f "$latest_front" ]; then
        cp "$latest_front" "$book_dir/assets/ai_front_cover$(printf '%s' "${latest_front##*.}" | sed 's/^/./')"
        echo "$book_dir/assets/ai_front_cover$(printf '%s' "${latest_front##*.}" | sed 's/^/./')"
        copied=true
    fi

    if [ -n "$latest_back" ] && [ -f "$latest_back" ]; then
        cp "$latest_back" "$book_dir/assets/ai_back_cover$(printf '%s' "${latest_back##*.}" | sed 's/^/./')"
        echo "$book_dir/assets/ai_back_cover$(printf '%s' "${latest_back##*.}" | sed 's/^/./')"
        copied=true
    fi

    if [ "$copied" = false ]; then
        echo "Cover automation completed. If the browser-based flow saved images manually, copy them from $covers_dir into $book_dir/assets." >&2
    fi
}

market_paths() {
    local book_dir="$1"
    local research_root="$book_dir/research/topic_market_research"
    mkdir -p "$research_root"
    echo "$research_root"
}

run_market_research() {
    local book_dir="$1"
    local subcommand="$2"
    shift 2
    local research_root
    research_root="$(market_paths "$book_dir")"
    local config_file="$research_root/book_research_config"
    local data_dir="$research_root/data"
    mkdir -p "$data_dir"

    if [ "$subcommand" != "init" ] && [ ! -f "$config_file" ]; then
        (
            cd "$research_root"
            BOOK_RESEARCH_CONFIG_FILE="$config_file" \
            BOOK_RESEARCH_DATA_DIR="$data_dir" \
            bash "$ROOT_DIR/topic_market_research.sh" init >/dev/null
        )
    fi

    (
        cd "$research_root"
        BOOK_RESEARCH_CONFIG_FILE="$config_file" \
        BOOK_RESEARCH_DATA_DIR="$data_dir" \
        bash "$ROOT_DIR/topic_market_research.sh" "$subcommand" "$@"
    )
}

market_analyzer() {
    local book_dir="$1"
    local topic="$2"
    ensure_book_layout "$book_dir"
    local out_dir="$book_dir/research/kdp_analysis_$(date +%Y%m%d)"
    KDP_ANALYZER_RESULTS_DIR="$out_dir" \
        bash "$ROOT_DIR/scripts/kdp_market_analyzer.sh" "$topic"
}

keyword_research() {
    local book_dir="$1"
    shift
    ensure_book_layout "$book_dir"
    local out_dir="$book_dir/research/keyword_results"
    mkdir -p "$out_dir"
    KEYWORD_OUTPUT_DIR="$out_dir" \
        bash "$ROOT_DIR/scripts/get_keywords.sh" "$@"
}

topic_finder() {
    local book_dir="$1"
    shift
    ensure_book_layout "$book_dir"
    local out_dir="$book_dir/research/topic_finder"
    mkdir -p "$out_dir"
    (
        cd "$out_dir"
        bash "$ROOT_DIR/scripts/kdp_topic_finder.sh" "$@"
    )
}

research_insights() {
    local book_dir="$1"
    local focus="${2:-}"
    ensure_book_layout "$book_dir"

    local research_dir="$book_dir/research"
    local insights_dir="$research_dir/insights"
    mkdir -p "$insights_dir"

    local context_file raw_file json_file summary_file
    local stamp
    stamp="$(date +%Y%m%d_%H%M%S)"
    context_file="$(mktemp)"
    raw_file="$insights_dir/ai_research_insights_${stamp}_raw.txt"
    json_file="$insights_dir/ai_research_insights_${stamp}.json"
    summary_file="$insights_dir/ai_research_insights_${stamp}.md"

    local picked=()
    while IFS= read -r file; do
        [ -n "$file" ] || continue
        picked+=("$file")
        [ "${#picked[@]}" -ge 8 ] && break
    done < <(
        find "$research_dir" -type f \
            \( -name '*.txt' -o -name '*.md' -o -name '*.json' -o -name '*.csv' \) \
            ! -path "$insights_dir/*" \
            -printf '%T@ %p\n' 2>/dev/null | sort -nr | cut -d' ' -f2-
    )

    if [ "${#picked[@]}" -eq 0 ]; then
        rm -f "$context_file"
        echo "No research files found in $research_dir. Run KDP analysis, keyword research, or topic finder first." >&2
        exit 1
    fi

    local outline_file outline_preview
    outline_file="$(find_outline_file "$book_dir" || true)"
    outline_preview=""
    [ -n "$outline_file" ] && outline_preview="$(sed -n '1,60p' "$outline_file" | head -c 2500)"

    local index=1
    local file
    for file in "${picked[@]}"; do
        {
            printf '### Source %s\n' "$index"
            printf 'Relative path: %s\n\n' "${file#$book_dir/}"
            case "$file" in
                *.json)
                    if command -v jq >/dev/null 2>&1; then
                        jq '.' "$file" 2>/dev/null | head -c 5000
                    else
                        head -c 5000 "$file"
                    fi
                    ;;
                *.csv)
                    head -n 40 "$file" | head -c 4000
                    ;;
                *)
                    sed -n '1,140p' "$file" | head -c 5000
                    ;;
            esac
            printf '\n\n'
        } >> "$context_file"
        index=$((index + 1))
    done

    local system_prompt user_prompt raw json
    system_prompt="You are a KDP market strategist. Return valid JSON only."
    user_prompt="Use the supplied research files to produce a sharp recommendation package for a book project.

Write explanations in Turkish.
When you propose title and subtitle concepts, write the titles in English and the rationale in Turkish.

Project focus: ${focus:-Find the strongest KDP angle, the best keyword path, and the clearest next actions.}

Return JSON with this exact shape:
{
  \"market_verdict\": {
    \"summary\": \"...\",
    \"confidence\": \"low|medium|high\",
    \"recommended_direction\": \"...\"
  },
  \"best_opportunities\": [
    {\"angle\": \"...\", \"why\": \"...\", \"effort\": \"low|medium|high\", \"priority\": 1}
  ],
  \"keyword_clusters\": [
    {\"cluster\": \"...\", \"keywords\": [\"...\"], \"intent\": \"...\"}
  ],
  \"title_concepts\": [
    {\"title\": \"...\", \"subtitle\": \"...\", \"why\": \"...\"}
  ],
  \"content_recommendations\": [\"...\"],
  \"next_actions\": [\"...\"],
  \"risks\": [\"...\"]
}

Rules:
- Base everything on the provided research files.
- If the research quality is weak, say that clearly in market_verdict.summary.
- best_opportunities: exactly 4 items, sorted by priority ascending.
- keyword_clusters: 3 to 5 clusters, each with up to 6 keywords.
- title_concepts: exactly 3 items.
- content_recommendations: exactly 5 concise items.
- next_actions: exactly 5 practical items.
- risks: exactly 3 concise warnings.
- Output JSON only.

Project notes:
- Book folder: $(basename "$book_dir")
- Outline preview:
${outline_preview:-No outline yet.}

Research files:
$(cat "$context_file")"

    raw="$(smart_api_call "$user_prompt" "$system_prompt" "research_strategy" 0.4 4096 2 "${OLLAMA_PREFERRED_MODEL:-}")"
    printf '%s\n' "$raw" > "$raw_file"
    json="$(extract_json_payload "$raw")"

    if ! printf '%s\n' "$json" | python3 -c 'import json,sys; json.load(sys.stdin)'; then
        rm -f "$context_file"
        echo "AI response could not be parsed as JSON. Raw response saved to $raw_file" >&2
        exit 1
    fi

    printf '%s\n' "$json" > "$json_file"

    if command -v jq >/dev/null 2>&1; then
        {
            echo "# Araştırma Öneri Merkezi"
            echo
            echo "Kaynak dosya sayısı: ${#picked[@]}"
            echo
            echo "## Pazar yorumu"
            jq -r '.market_verdict.summary' "$json_file"
            echo
            echo "Önerilen yön: $(jq -r '.market_verdict.recommended_direction' "$json_file")"
            echo "Güven seviyesi: $(jq -r '.market_verdict.confidence' "$json_file")"
            echo
            echo "## En güçlü fırsatlar"
            jq -r '.best_opportunities[] | "- [P" + (.priority|tostring) + "] " + .angle + " | Neden: " + .why + " | Efor: " + .effort' "$json_file"
            echo
            echo "## Anahtar kelime kümeleri"
            jq -r '.keyword_clusters[] | "- " + .cluster + " | Niyet: " + .intent + " | Kelimeler: " + (.keywords | join(", "))' "$json_file"
            echo
            echo "## İngilizce başlık fikirleri"
            jq -r '.title_concepts[] | "- " + .title + ": " + .subtitle + " | " + .why' "$json_file"
            echo
            echo "## İçerik önerileri"
            jq -r '.content_recommendations[] | "- " + .' "$json_file"
            echo
            echo "## Sonraki adımlar"
            jq -r '.next_actions[] | "- " + .' "$json_file"
            echo
            echo "## Riskler"
            jq -r '.risks[] | "- " + .' "$json_file"
        } > "$summary_file"
    fi

    rm -f "$raw_file" "$context_file"
    printf '%s\n' "$json"
}

appendices_generate() {
    local book_dir="$1"
    ensure_book_layout "$book_dir"
    APPENDICES_OVERWRITE=1 \
        bash "$ROOT_DIR/generate_appendices.sh" "$book_dir"
}

references_generate() {
    local book_dir="$1"
    ensure_book_layout "$book_dir"
    bash "$ROOT_DIR/generate_references.sh" "$book_dir"
}

main() {
    local action="${1:-}"
    shift || true

    case "$action" in
        topic-suggest) topic_suggest "$@" ;;
        outline-json) outline_json "$@" ;;
        chapter-generate) chapter_generate "$@" ;;
        chapter-plagiarism) chapter_plagiarism "$@" ;;
        chapter-rewrite) chapter_rewrite "$@" ;;
        chapter-review) chapter_review "$@" ;;
        chapter-extend) chapter_extend "$@" ;;
        cover-local) generate_local_cover "$@" ;;
        cover-script-run) run_cover_script "$@" ;;
        appendices) appendices_generate "$@" ;;
        references) references_generate "$@" ;;
        market-init) run_market_research "$1" init ;;
        market-search) run_market_research "$1" search "$2" "${3:-20}" ;;
        market-discover) run_market_research "$1" discover ;;
        market-report) run_market_research "$1" report ;;
        market-clean) run_market_research "$1" clean ;;
        market-status) run_market_research "$1" status ;;
        market-analyzer) market_analyzer "$@" ;;
        keyword-research) keyword_research "$@" ;;
        topic-finder) topic_finder "$@" ;;
        research-insights) research_insights "$@" ;;
        plagiarism-reports) bash "$ROOT_DIR/scripts/plagiarism_report_manager.sh" "$@" ;;
        migrate-outputs) bash "$ROOT_DIR/scripts/migrate_book_outputs.sh" ;;
        *)
            echo "Usage:"
            echo "  $0 topic-suggest <niche> [audience] [category]"
            echo "  $0 outline-json <topic> <genre> <audience> [style] [tone] [language]"
            echo "  $0 chapter-generate <book_dir> <chapter_num> <chapter_title> <min_words> <max_words> [style] [tone] [language]"
            echo "  $0 chapter-plagiarism <book_dir> <chapter_num>"
            echo "  $0 chapter-rewrite <book_dir> <chapter_num>"
            echo "  $0 chapter-review <book_dir> <chapter_num>"
            echo "  $0 chapter-extend <book_dir> <chapter_num> [min_words] [max_words]"
            echo "  $0 cover-local <book_dir> <title> [subtitle] [author] [blurb]"
            echo "  $0 cover-script-run <book_dir> <generate|front|back> <service> <unused> <unused> <title> <author> <genre>"
            echo "  $0 appendices <book_dir>"
            echo "  $0 references <book_dir>"
            echo "  $0 market-init <book_dir>"
            echo "  $0 market-search <book_dir> <topic> [count]"
            echo "  $0 market-discover <book_dir>"
            echo "  $0 market-report <book_dir>"
            echo "  $0 market-clean <book_dir>"
            echo "  $0 market-status <book_dir>"
            echo "  $0 market-analyzer <book_dir> <topic>"
            echo "  $0 keyword-research <book_dir> <keyword1> [keyword2...]"
            echo "  $0 topic-finder <book_dir> [seed-topic]"
            echo "  $0 research-insights <book_dir> [focus]"
            echo "  $0 plagiarism-reports <book_dir> <summary|details|flagged|export|clean>"
            echo "  $0 migrate-outputs"
            exit 1
            ;;
    esac
}

main "$@"
