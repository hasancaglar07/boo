#!/bin/bash

# Improved chapter handling functions to properly handle chapter length requirements

# Animation function for waiting periods
show_wait_animation() {
    local wait_time=$1
    local message=$2
    local animation_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
    local i=0
    local start_time=$(date +%s)
    local end_time=$((start_time + wait_time))
    local current_time=$start_time
    
    # Hide cursor
    echo -en "\033[?25l"
    
    while [ $current_time -lt $end_time ]; do
        local remaining=$((end_time - current_time))
        local char="${animation_chars[$i]}"
        echo -ne "\r${CYAN}${char}${RESET} ${message} (${YELLOW}${remaining}s${RESET} remaining)     "
        i=$(((i + 1) % ${#animation_chars[@]}))
        sleep 0.1
        current_time=$(date +%s)
    done
    
    # Show cursor and clear line
    echo -e "\r\033[K${GREEN}✓${RESET} ${message} completed!     "
    echo -en "\033[?25h"
}

# Function to calculate tokens required for chapter extension
# Formula: MAX_TOKENS = (500 minimum word length * 1.25) - (current chapter word length * 1.25) 
#          + (system prompt word length * 1.25) + (user prompt word length * 1.25) + 250
calculate_chapter_extension_tokens() {
    local current_words="$1"
    local min_words="${2:-500}"
    local system_prompt_words="${3:-50}"  # Estimated system prompt length
    local user_prompt_words="${4:-200}"   # Estimated user prompt length
    
    # Calculate using formula
    local tokens=$(( (min_words * 125 / 100) - (current_words * 125 / 100) + 
                     (system_prompt_words * 125 / 100) + (user_prompt_words * 125 / 100) + 250 ))
    
    # Ensure we don't go below a reasonable minimum
    if [ "$tokens" -lt 500 ]; then
        tokens=500
    fi
    
    echo "$tokens"
}

extract_recent_chapter_excerpt() {
    local chapter_file="$1"
    local max_words="${2:-1200}"
    python3 - "$chapter_file" "$max_words" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
limit = max(1, int(sys.argv[2]))
text = path.read_text(encoding="utf-8", errors="replace").strip()
words = text.split()
if len(words) > limit:
    text = " ".join(words[-limit:])
sys.stdout.write(text)
PY
}

sanitize_extension_block() {
    python3 - <<'PY'
import re
import sys

text = sys.stdin.read().replace("\r\n", "\n").replace("\r", "\n").strip()
lines = text.splitlines()
while lines and (
    re.match(r"^\s*#{1,6}\s+", lines[0])
    or re.match(r"^\s*(chapter|bölüm)\s+\d+\s*[:.-]", lines[0], re.IGNORECASE)
):
    lines.pop(0)
cleaned = "\n".join(lines).strip()
cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
sys.stdout.write(cleaned)
PY
}

# Function to review and process chapter based on length
process_chapter_by_length() {
    local chapter_file="$1"
    local min_words="${2:-2000}"
    local max_words="${3:-2500}"
    
    # Get current word count
    local current_word_count=$(wc -w < "$chapter_file" | tr -d ' ')
    echo "📊 Current word count: $current_word_count words"
    
    if [ "$current_word_count" -ge "$min_words" ]; then
        # Chapter is already long enough, just review for quality
        echo "✅ Chapter meets minimum word count requirement ($current_word_count words)"
        # review_chapter_quality "$chapter_file"
        return 0
    else
        # Chapter needs extension
        echo "⚠️ Chapter below minimum word count: $current_word_count/$min_words words"
        if ! extend_chapter_to_min_length "$chapter_file" "$min_words" "$max_words"; then
            echo "⚠️ First extension pass did not produce a usable continuation"
        fi
        
        # Check if extension succeeded
        local final_word_count=$(wc -w < "$chapter_file" | tr -d ' ')
        if [ "$final_word_count" -lt "$min_words" ]; then
            echo "⚠️ Chapter still below minimum after extension: $final_word_count/$min_words words"
            echo "🔄 Trying one final extension attempt..."
            if ! extend_chapter_to_min_length "$chapter_file" "$min_words" "$max_words" "final"; then
                echo "⚠️ Final extension pass did not produce a usable continuation"
            fi
        fi

        final_word_count=$(wc -w < "$chapter_file" | tr -d ' ')
        if [ "$final_word_count" -lt "$min_words" ]; then
            echo "❌ Chapter remains below minimum after extension attempts: $final_word_count/$min_words words"
            return 1
        fi

        return 0
    fi
}

# Function to review chapter quality without changing length
review_chapter_quality() {
    local chapter_file="$1"
    
    echo "🔍 Reviewing chapter quality..."
    local chapter_content=$(cat "$chapter_file")
    
    # Create a review prompt that doesn't change length
    local review_prompt="Review and improve this chapter for quality without significantly changing its length. 

Focus on:
- Improving flow and readability
- Enhancing clarity and precision
- Fixing grammar and style issues
- Ensuring consistency in tone and voice
- Strengthening arguments and examples

DO NOT:
- Add significant new content
- Remove substantial content
- Change the structure or organization

Return the complete revised chapter with the same approximate word count.

CHAPTER CONTENT:
$chapter_content"

    local review_system_prompt="You are an expert book editor who improves content quality without changing length."
    
    # Call API to review the chapter
    echo "🤖 Generating quality improvements..."
    local reviewed_content=$(smart_api_call "$review_prompt" "$review_system_prompt" "quality_check" 0.7 3000 1 "llama3.2:1b")
    
    # Check if API call was successful
    if [ $? -eq 0 ] && [ -n "$reviewed_content" ]; then
        # Clean up the content
        reviewed_content=$(clean_llm_output "$reviewed_content")
        
        # Save the reviewed chapter
        local backup_file="${chapter_file}.before_review"
        cp "$chapter_file" "$backup_file"
        echo "$reviewed_content" > "$chapter_file"
        echo "✅ Quality review completed and saved"
        
        # Final word count
        local final_word_count=$(wc -w < "$chapter_file" | tr -d ' ')
        echo "📊 Final word count after review: $final_word_count words"
    else
        echo "⚠️ Quality review failed, keeping original chapter"
    fi
}

# Function to extend chapter to meet minimum length
extend_chapter_to_min_length() {
    local chapter_file="$1"
    local min_words="$2"
    local max_words="$3"
    local attempt_type="${4:-standard}"
    
    # Get current content and word count
    local chapter_content=$(cat "$chapter_file")
    local current_word_count=$(wc -w < "$chapter_file" | tr -d ' ')
    local words_needed=$((min_words - current_word_count))
    local target_addition_words
    local minimum_addition_threshold
    local recent_excerpt
    local extension_block
    local added_word_count
    
    echo "🔍 Extending chapter by approximately $words_needed words..."
    
    # Calculate tokens based on our formula
    local extension_tokens=$(calculate_chapter_extension_tokens "$current_word_count" "$min_words")
    echo "ℹ️ Using $extension_tokens tokens for chapter extension"

    if [ "$words_needed" -le 0 ]; then
        echo "✅ No extension needed"
        return 0
    fi

    target_addition_words="$words_needed"
    if [ "$target_addition_words" -lt 220 ]; then
        target_addition_words=220
    fi
    minimum_addition_threshold=$((words_needed / 3))
    if [ "$minimum_addition_threshold" -lt 140 ]; then
        minimum_addition_threshold=140
    fi
    if [ "$attempt_type" = "final" ]; then
        minimum_addition_threshold=$((minimum_addition_threshold * 2 / 3))
        if [ "$minimum_addition_threshold" -lt 100 ]; then
            minimum_addition_threshold=100
        fi
    fi
    recent_excerpt="$(extract_recent_chapter_excerpt "$chapter_file" 1100)"
    
    # Create an extension prompt
    local extension_prompt="Write ONLY the missing continuation paragraphs for this chapter so they can be appended after the current ending.

REQUIREMENTS:
- Add approximately ${target_addition_words} new words
- Continue naturally from the exact current ending
- Expand the existing scene, ideas, examples, and emotional momentum with substantive material
- Maintain the same style, tone, tense, and voice as the original chapter
- DO NOT rewrite or summarize earlier paragraphs
- DO NOT return the full chapter
- DO NOT add a heading, title line, label, bullet list, or recap
- Return only the new paragraphs to append

CURRENT CHAPTER WORD COUNT: ${current_word_count}
TARGET MINIMUM WORD COUNT: ${min_words}
CURRENT CHAPTER ENDING CONTEXT:
${recent_excerpt}"

    local extension_system_prompt="You are an expert book author extending a chapter with seamless continuation paragraphs. Produce only appendable prose."

    if [ "$attempt_type" = "final" ]; then
        # Increase token count by 20% for final attempt
        extension_tokens=$(( extension_tokens * 120 / 100 ))
    fi
    # API rate limit delay
    local jitter=$((RANDOM % 5))
    local cooldown_base="${DELAY_BETWEEN_CHAPTERS:-0}"
    show_wait_animation "$((cooldown_base + jitter))" "Chapter cooldown"
    # Call API to extend the chapter
    echo "🤖 Generating append-only continuation..."
    local extended_content
    extended_content=$(smart_api_call "$extension_prompt" "$extension_system_prompt" "chapter_extension" 0.7 "$extension_tokens" 2)
    
    # Check if API call was successful
    if [ $? -eq 0 ] && [ -n "$extended_content" ]; then
        # Clean up the content
        extension_block="$(printf '%s' "$extended_content" | clean_llm_output | sanitize_extension_block)"
        added_word_count=$(printf '%s' "$extension_block" | wc -w | tr -d ' ')

        if [ -z "$extension_block" ] || [ "$added_word_count" -lt "$minimum_addition_threshold" ]; then
            echo "⚠️ Extension output was too short to trust (${added_word_count} words, expected at least ${minimum_addition_threshold})"
            return 1
        fi

        # Save the extended chapter by appending only the new continuation.
        local backup_file="${chapter_file}.before_extension"
        cp "$chapter_file" "$backup_file"
        printf '%s\n\n%s\n' "$(printf '%s' "$chapter_content" | sed '${/^$/d;}')" "$extension_block" > "$chapter_file"
        echo "✅ Chapter extension completed and saved"
        
        # Final word count
        local final_word_count=$(wc -w < "$chapter_file" | tr -d ' ')
        echo "📊 Final word count after extension: $final_word_count words"

        if [ "$final_word_count" -le "$current_word_count" ]; then
            cp "$backup_file" "$chapter_file"
            echo "⚠️ Extension would have reduced chapter length; original chapter restored"
            return 1
        fi
        
        # Check if we're still below minimum
        if [ "$final_word_count" -lt "$min_words" ] && [ "$attempt_type" != "final" ]; then
            echo "⚠️ Still below minimum word count: $final_word_count/$min_words words"
        elif [ "$final_word_count" -ge "$min_words" ]; then
            echo "✅ Successfully extended chapter to meet minimum word count"
        fi
        return 0
    else
        echo "⚠️ Chapter extension failed, keeping original chapter"
        return 1
    fi
}
