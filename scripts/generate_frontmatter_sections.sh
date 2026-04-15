#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")/.." && pwd)"
# shellcheck source=../book-generator-env.sh
source "$ROOT_DIR/book-generator-env.sh"
# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/multi_provider_ai_simple.sh"

BOOK_DIR="${1:-}"
SECTIONS_RAW="${2:-dedication,preface,introduction}"
LANGUAGE_ARG="${3:-}"

if [ -z "${BOOK_DIR// /}" ] || [ ! -d "$BOOK_DIR" ]; then
  echo "Usage: $0 <book_dir> [sections_csv] [language]" >&2
  exit 1
fi

clean_llm_output() {
  printf '%s\n' "${1:-}" | sed -e '1{/^```[a-zA-Z]*$/d;}' -e '${/^```$/d;}'
}

normalize_language() {
  local raw
  raw="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | sed 's/^ *//; s/ *$//')"
  case "$raw" in
    tr*|turkish|türkçe|turkce|turk) printf '%s\n' "Turkish" ;;
    *) printf '%s\n' "English" ;;
  esac
}

find_outline_file() {
  local book_dir="$1"
  local candidate=""
  for pattern in "book_outline_final_"*.md "book_outline_"*.md "outline.md"; do
    for candidate in "$book_dir"/$pattern; do
      if [ -f "$candidate" ]; then
        printf '%s\n' "$candidate"
        return 0
      fi
    done
  done
  return 1
}

detect_language_from_sample() {
  local sample="$*"
  if [ -z "${sample// /}" ]; then
    printf '%s\n' "English"
    return 0
  fi
  if printf '%s' "$sample" | grep -qi '[çğıöşüÇĞİÖŞÜ]'; then
    printf '%s\n' "Turkish"
    return 0
  fi
  printf '%s\n' "English"
}

infer_language() {
  local book_dir="$1"
  local explicit="${2:-}"
  local meta_file="$book_dir/dashboard_meta.json"
  local normalized=""
  local raw=""
  local outline_file=""
  local sample=""

  normalized="$(normalize_language "$explicit")"
  if [ -n "${explicit// /}" ]; then
    printf '%s\n' "$normalized"
    return 0
  fi

  if [ -f "$meta_file" ]; then
    if command -v jq >/dev/null 2>&1; then
      raw="$(jq -r '.language // empty' "$meta_file" 2>/dev/null || true)"
    else
      raw="$(grep -Eo '"language"[[:space:]]*:[[:space:]]*"[^"]+"' "$meta_file" | head -n 1 | sed -E 's/.*"language"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/' || true)"
    fi
    if [ -n "${raw// /}" ]; then
      printf '%s\n' "$(normalize_language "$raw")"
      return 0
    fi
  fi

  outline_file="$(find_outline_file "$book_dir" || true)"
  if [ -n "$outline_file" ] && [ -f "$outline_file" ]; then
    sample="$(sed -n '1,60p' "$outline_file")"
  fi
  if [ -z "${sample// /}" ]; then
    local first_chapter=""
    first_chapter="$(find "$book_dir" -maxdepth 1 -type f -name 'chapter_*_final.md' | sort -V | head -n 1 || true)"
    if [ -n "$first_chapter" ] && [ -f "$first_chapter" ]; then
      sample="$(sed -n '1,80p' "$first_chapter")"
    fi
  fi
  detect_language_from_sample "$sample"
}

section_heading() {
  local section="$1"
  local language="$2"
  case "$section" in
    dedication)
      [ "$language" = "Turkish" ] && printf '%s\n' "Adanış" || printf '%s\n' "Dedication"
      ;;
    preface)
      [ "$language" = "Turkish" ] && printf '%s\n' "Önsöz" || printf '%s\n' "Preface"
      ;;
    introduction)
      [ "$language" = "Turkish" ] && printf '%s\n' "Giriş" || printf '%s\n' "Introduction"
      ;;
    *)
      printf '%s\n' "$section"
      ;;
  esac
}

section_min_words() {
  case "$1" in
    dedication) printf '%s\n' "90" ;;
    preface) printf '%s\n' "420" ;;
    introduction) printf '%s\n' "600" ;;
    *) printf '%s\n' "220" ;;
  esac
}

section_max_tokens() {
  case "$1" in
    dedication) printf '%s\n' "1400" ;;
    preface) printf '%s\n' "2600" ;;
    introduction) printf '%s\n' "3200" ;;
    *) printf '%s\n' "2200" ;;
  esac
}

section_target_hint() {
  case "$1" in
    dedication) printf '%s\n' "120-180 words, 2-4 elegant paragraphs." ;;
    preface) printf '%s\n' "650-900 words, coherent narrative with practical framing." ;;
    introduction) printf '%s\n' "900-1300 words, structured roadmap and strong reader hook." ;;
    *) printf '%s\n' "Professional long-form section." ;;
  esac
}

section_requirements() {
  local section="$1"
  local language="$2"
  if [ "$language" = "Turkish" ]; then
    case "$section" in
      dedication)
        cat <<'EOF'
- Klişe ve boş övgülerden kaçın.
- Kişisel fakat profesyonel bir tonda yaz.
- Kitabın temasına anlamlı biçimde bağla.
- Madde işareti kullanma.
EOF
        ;;
      preface)
        cat <<'EOF'
- Kitabın amacı, kapsamı ve okura sağlayacağı dönüşümü net açıkla.
- Yazım motivasyonu ve yaklaşımı somut gerekçelerle anlat.
- Kimler için yazıldığını ve nasıl okunacağını operasyonel şekilde belirt.
- Pazarlama metni gibi değil, editoryal bir önsöz gibi yaz.
- Madde işareti yerine akıcı paragraf yapısı kullan.
EOF
        ;;
      introduction)
        cat <<'EOF'
- Ana problemi güçlü bir açılışla tanımla.
- Bölüm mimarisini ve öğrenme akışını net bir yol haritası halinde anlat.
- Okurun bölüm sonunda neyi yapabilir hale geleceğini somutlaştır.
- Kavramsal açıklama ile pratik uygulama dengesini koru.
- Madde işareti yerine akıcı paragraf yapısı kullan.
EOF
        ;;
      *)
        printf '%s\n' "- Profesyonel, net ve uygulanabilir bir metin üret."
        ;;
    esac
    return 0
  fi

  case "$section" in
    dedication)
      cat <<'EOF'
- Avoid generic sentiment and vague praise.
- Keep it personal but editorially polished.
- Tie the dedication to the book's mission.
- Do not use bullet points.
EOF
      ;;
    preface)
      cat <<'EOF'
- Clearly state purpose, scope, and intended reader outcomes.
- Explain author motivation and editorial approach with specifics.
- Clarify who should read the book and how to use it effectively.
- Keep a professional publishing voice, not marketing copy.
- Use flowing paragraphs instead of bullet points.
EOF
      ;;
    introduction)
      cat <<'EOF'
- Open with a clear statement of the core problem or opportunity.
- Present a structured roadmap of the book's progression.
- Define practical outcomes readers can expect by the end.
- Balance conceptual framing with operational guidance.
- Use flowing paragraphs instead of bullet points.
EOF
      ;;
    *)
      printf '%s\n' "- Produce professional, clear, publication-ready prose."
      ;;
  esac
}

trim_markdown_body() {
  local text="$1"
  printf '%s\n' "$text" | awk '
    NR == 1 && $0 ~ /^[[:space:]]*#{1,6}[[:space:]]+/ { next }
    { lines[++count] = $0 }
    END {
      start = 1
      while (start <= count && lines[start] ~ /^[[:space:]]*$/) start++
      end = count
      while (end >= start && lines[end] ~ /^[[:space:]]*$/) end--
      for (i = start; i <= end; i++) print lines[i]
    }
  '
}

outline_file="$(find_outline_file "$BOOK_DIR" || true)"
book_title=""
book_subtitle=""
if [ -n "$outline_file" ] && [ -f "$outline_file" ]; then
  book_title="$(grep -m 1 -E '^[[:space:]]*#[[:space:]]+' "$outline_file" | sed -E 's/^[[:space:]]*#[[:space:]]+//; s/\r$//' || true)"
  book_subtitle="$(grep -m 1 -E '^[[:space:]]*##[[:space:]]+' "$outline_file" | sed -E 's/^[[:space:]]*##[[:space:]]+//; s/\r$//' || true)"
fi
if [ -z "${book_title// /}" ]; then
  book_title="$(basename "$BOOK_DIR" | tr '-' ' ')"
fi

book_language="$(infer_language "$BOOK_DIR" "$LANGUAGE_ARG")"

outline_excerpt=""
if [ -n "$outline_file" ] && [ -f "$outline_file" ]; then
  outline_excerpt="$(sed -n '1,220p' "$outline_file" | head -c 7000 || true)"
fi
if [ -z "${outline_excerpt// /}" ]; then
  outline_excerpt="No outline excerpt found."
fi

chapter_context=""
chapter_counter=0
while IFS= read -r chapter_file; do
  [ -f "$chapter_file" ] || continue
  chapter_counter=$((chapter_counter + 1))
  chapter_number="$(printf '%s' "$(basename "$chapter_file")" | sed -E 's/^chapter_([0-9]+)_final\.md$/\1/' || true)"
  chapter_excerpt="$(sed '1{/^[[:space:]]*#[[:space:]]+/d;}' "$chapter_file" | sed -n '1,140p' | head -c 2600 || true)"
  if [ -n "${chapter_excerpt// /}" ]; then
    chapter_context="${chapter_context}

[Chapter ${chapter_number:-$chapter_counter} excerpt]
${chapter_excerpt}"
  fi
  if [ "$chapter_counter" -ge 2 ]; then
    break
  fi
done < <(find "$BOOK_DIR" -maxdepth 1 -type f -name 'chapter_*_final.md' | sort -V)

if [ -z "${chapter_context// /}" ]; then
  chapter_context="No chapter excerpts found."
fi

provider_timeout="${BOOK_FRONTMATTER_PROVIDER_TIMEOUT_SECONDS:-65}"
max_retries="${BOOK_FRONTMATTER_MAX_RETRIES:-2}"
fast_failover="${BOOK_FRONTMATTER_FAST_FAILOVER:-1}"
provider_order="${BOOK_FRONTMATTER_TEXT_PROVIDER_ORDER:-claude-main glm-main vertex-main}"

IFS=',' read -r -a requested_sections <<< "$SECTIONS_RAW"
if [ "${#requested_sections[@]}" -eq 0 ]; then
  requested_sections=("dedication" "preface" "introduction")
fi

declare -a normalized_sections=()
for raw_section in "${requested_sections[@]}"; do
  section="$(printf '%s' "$raw_section" | tr '[:upper:]' '[:lower:]' | tr '-' '_' | sed 's/^ *//; s/ *$//')"
  case "$section" in
    dedication|preface|introduction)
      normalized_sections+=("$section")
      ;;
    "")
      ;;
    *)
      echo "Unknown section: $raw_section" >&2
      exit 1
      ;;
  esac
done

if [ "${#normalized_sections[@]}" -eq 0 ]; then
  normalized_sections=("dedication" "preface" "introduction")
fi

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

for section in "${normalized_sections[@]}"; do
  heading="$(section_heading "$section" "$book_language")"
  target_hint="$(section_target_hint "$section")"
  min_words="$(section_min_words "$section")"
  max_tokens="$(section_max_tokens "$section")"
  section_rules="$(section_requirements "$section" "$book_language")"

  system_prompt="You are a senior publishing ghostwriter and developmental editor. Write polished, publication-ready book frontmatter in ${book_language}. Keep the prose specific, coherent, and professional. Return only markdown for the requested section."
  user_prompt="Write the ${heading} section for this book.

Book title: ${book_title}
Book subtitle: ${book_subtitle}
Target language: ${book_language}
Required heading: # ${heading}
Target length: ${target_hint}

Quality requirements:
${section_rules}

Context from outline:
${outline_excerpt}

Context from early chapters:
${chapter_context}

Output constraints:
- Return markdown only.
- Start with '# ${heading}'.
- Do not add explanations, notes, or system commentary.
- Do not use placeholder text."

  generated="$(CODEFAST_TEXT_PROVIDER_ORDER="$provider_order" smart_api_call \
    "$user_prompt" \
    "$system_prompt" \
    "creative" \
    "0.72" \
    "$max_tokens" \
    "$max_retries" \
    "$min_words" \
    "$provider_timeout" \
    "$fast_failover")"
  generated="$(clean_llm_output "$generated")"
  body="$(trim_markdown_body "$generated")"

  body_word_count="$(printf '%s\n' "$body" | wc -w | tr -d ' ')"
  if [ -z "${body// /}" ] || [ "${body_word_count:-0}" -lt "$min_words" ]; then
    echo "Generated ${section} content is too short (${body_word_count:-0} words)." >&2
    exit 1
  fi

  tmp_file="$tmp_root/${section}.md"
  printf '# %s\n\n%s\n' "$heading" "$body" > "$tmp_file"
done

mkdir -p "$BOOK_DIR/extras"
for section in "${normalized_sections[@]}"; do
  source_file="$tmp_root/${section}.md"
  extras_file="$BOOK_DIR/extras/${section}.md"
  root_file="$BOOK_DIR/${section}.md"
  cp "$source_file" "$extras_file"
  cp "$source_file" "$root_file"
done

printf 'Frontmatter generated: %s\n' "$(IFS=,; printf '%s' "${normalized_sections[*]}")"
