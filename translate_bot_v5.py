#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TR->EN Translation Bot v5
Uses GLM-5.1 API via curl for translation.
Processes files in small batches to avoid truncation.
"""

import subprocess
import json
import sys
import os
import re
import time
import tempfile

# ── Config ──────────────────────────────────────────────
API_URL = "https://claudecode2.codefast.app/v1/messages"
API_KEY = "sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98"
MODEL = "glm-5.1"

# Turkish chars for detection
TR_CHARS = set("ğüşöçıĞÜŞÖÇİ")

# Files to skip
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build"}
SKIP_FILES = {"translate_bot.py", "translate_bot_v5.py", "fix_layout.py", "lang-provider.tsx"}


def call_api(prompt):
    """Call GLM-5.1 API via curl, return text response."""
    payload = json.dumps({
        "model": MODEL,
        "max_tokens": 4000,
        "messages": [{"role": "user", "content": prompt}]
    })

    # Write payload to temp file to avoid shell escaping issues
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8")
    tmp.write(payload)
    tmp.close()

    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", API_URL,
             "-H", "Content-Type: application/json",
             "-H", f"x-api-key: {API_KEY}",
             "-H", "anthropic-version: 2023-06-01",
             "-d", f"@{tmp.name}"],
            capture_output=True, text=True, timeout=60,
            encoding="utf-8"
        )
    finally:
        os.unlink(tmp.name)

    if result.returncode != 0:
        return None

    try:
        data = json.loads(result.stdout)
        return data["content"][0]["text"]
    except (json.JSONDecodeError, KeyError, IndexError):
        return None


def has_turkish(text):
    """Check if text contains Turkish characters."""
    return any(c in TR_CHARS for c in text)


def extract_strings_from_line(line):
    """Extract translatable string segments from a code line."""
    # Find all string literals (single/double quotes, template literals)
    segments = []

    # Match "..." and '...' strings
    for m in re.finditer(r'(?<!\\)["\']([^"\']*[ğüşöçıĞÜŞÖÇİ][^"\']*)["\']', line):
        segments.append({
            "full": m.group(0),
            "content": m.group(1),
            "start": m.start(),
            "end": m.end(),
        })

    # Match template literal segments: `...`
    for m in re.finditer(r'`([^`]*[ğüşöçıĞÜŞÖÇİ][^`]*)`', line):
        segments.append({
            "full": m.group(0),
            "content": m.group(1),
            "start": m.start(),
            "end": m.end(),
        })

    # Match JSX text: >Türkçe metin<
    for m in re.finditer(r'>([^<>{]*[ğüşöçıĞÜŞÖÇİ][^<>{]*)<', line):
        text = m.group(1).strip()
        if text and has_turkish(text):
            segments.append({
                "full": m.group(0),
                "content": m.group(1),
                "start": m.start(),
                "end": m.end(),
                "jsx": True,
            })

    # Match comments: // Türkçe
    for m in re.finditer(r'(//[^\n]*[ğüşöçıĞÜŞÖÇİ][^\n]*)', line):
        segments.append({
            "full": m.group(0),
            "content": m.group(1),
            "start": m.start(),
            "end": m.end(),
            "comment": True,
        })

    return segments


def translate_batch(strings_to_translate):
    """Translate a batch of strings via API."""
    if not strings_to_translate:
        return {}

    # Build numbered list
    lines = []
    for i, s in enumerate(strings_to_translate):
        lines.append(f"{i+1}. {s}")

    text_block = "\n".join(lines)

    prompt = f"""Translate the following Turkish text to English. Output ONLY the numbered translations, one per line. Keep the same format: "number. translation". Do NOT add explanations. Preserve any HTML tags, variable references like {{variable}}, and special characters exactly.

{text_block}"""

    response = call_api(prompt)
    if not response:
        return {}

    # Parse response
    translations = {}
    for line in response.strip().split("\n"):
        line = line.strip()
        m = re.match(r'(\d+)\.\s*(.*)', line)
        if m:
            idx = int(m.group(1)) - 1
            translations[idx] = m.group(2)

    return translations


def translate_file(filepath):
    """Translate all Turkish strings in a file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split("\n")
    total_changes = 0

    # Collect all Turkish strings
    all_strings = []
    line_segments = {}  # line_idx -> list of segments

    for i, line in enumerate(lines):
        segs = extract_strings_from_line(line)
        if segs:
            line_segments[i] = segs
            for seg in segs:
                all_strings.append(seg["content"])

    if not all_strings:
        print(f"  CLEAN - no Turkish found", flush=True)
        return 0

    print(f"  Found {len(all_strings)} Turkish segments", flush=True)

    # Translate in batches of 10
    all_translations = {}
    batch_size = 10

    for batch_start in range(0, len(all_strings), batch_size):
        batch_end = min(batch_start + batch_size, len(all_strings))
        batch = all_strings[batch_start:batch_end]

        print(f"  Translating batch {batch_start+1}-{batch_end}/{len(all_strings)}...", end="", flush=True)

        translations = translate_batch(batch)
        print(f" got {len(translations)} translations", flush=True)

        for idx, trans in translations.items():
            all_translations[batch_start + idx] = trans

        time.sleep(1)  # Rate limit

    # Apply translations back to file
    # Process lines in reverse order to preserve positions
    new_lines = list(lines)

    for line_idx in sorted(line_segments.keys(), reverse=True):
        segs = line_segments[line_idx]
        line = new_lines[line_idx]

        # Process segments in reverse to preserve positions
        for seg in sorted(segs, key=lambda s: s["start"], reverse=True):
            # Find the global index of this segment
            global_idx = 0
            for li in sorted(line_segments.keys()):
                if li > line_idx:
                    break
                for s in line_segments[li]:
                    if li == line_idx and s is seg:
                        break
                    global_idx += 1

            if global_idx in all_translations:
                old_text = seg["content"]
                new_text = all_translations[global_idx]

                if seg.get("jsx"):
                    # JSX: preserve whitespace
                    old_full = seg["full"]
                    prefix = old_full[:old_full.index(old_text)]
                    suffix = old_full[old_full.index(old_text) + len(old_text):]
                    new_full = prefix + new_text + suffix
                elif seg.get("comment"):
                    new_full = "// " + new_text
                else:
                    # String literal - preserve quotes
                    quote = seg["full"][0]
                    new_full = quote + new_text + quote

                line = line[:seg["start"]] + new_full + line[seg["end"]:]
                total_changes += 1

        new_lines[line_idx] = line

    if total_changes > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines))
        print(f"  APPLIED {total_changes} changes", flush=True)
    else:
        print(f"  NO changes applied", flush=True)

    return total_changes


def scan_files(root="web/src"):
    """Scan for files with Turkish content."""
    results = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Skip unwanted dirs
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for fname in filenames:
            fpath = os.path.join(dirpath, fname).replace("\\", "/")

            if fname in SKIP_FILES:
                continue
            if not fname.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue

            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                count = sum(1 for line in content.split("\n") if has_turkish(line))
                if count > 0:
                    results.append((fpath, count))
            except Exception:
                pass

    results.sort(key=lambda x: -x[1])
    return results


def main():
    print("=== TR->EN Translation Bot v5 ===", flush=True)

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python translate_bot_v5.py scan              - Scan for Turkish")
        print("  python translate_bot_v5.py translate <file>   - Translate one file")
        print("  python translate_bot_v5.py batch <n>          - Translate top N files")
        print("  python translate_bot_v5.py all                - Translate all files")
        return

    cmd = sys.argv[1]

    if cmd == "scan":
        results = scan_files()
        total_lines = sum(c for _, c in results)
        print(f"\n{len(results)} files, {total_lines} Turkish lines\n", flush=True)
        for fpath, count in results:
            print(f"  {count:>5}  {fpath}", flush=True)

    elif cmd == "translate":
        if len(sys.argv) < 3:
            print("Error: provide file path")
            return
        filepath = sys.argv[2]
        print(f"Translating: {filepath}", flush=True)
        changes = translate_file(filepath)
        print(f"Done: {changes} changes", flush=True)

    elif cmd == "batch":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        results = scan_files()
        top_n = results[:n]

        total_changes = 0
        for fpath, count in top_n:
            print(f"\n--- {fpath} ({count} lines) ---", flush=True)
            changes = translate_file(fpath)
            total_changes += changes
            time.sleep(2)

        print(f"\n=== Batch done: {total_changes} total changes ===", flush=True)

    elif cmd == "all":
        results = scan_files()
        total_changes = 0
        processed = 0

        for fpath, count in results:
            processed += 1
            print(f"\n--- [{processed}/{len(results)}] {fpath} ({count} lines) ---", flush=True)
            changes = translate_file(fpath)
            total_changes += changes
            time.sleep(2)

        print(f"\n=== ALL DONE: {total_changes} total changes across {processed} files ===", flush=True)

    else:
        print(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
