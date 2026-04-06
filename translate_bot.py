#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Turkish -> English Translation Bot v4
GLM-5.1 API via curl
Handles: string literals, JSX text nodes, comments
"""

import os, re, json, time, sys, subprocess, io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

API_KEY = "sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98"
BASE_URL = "https://claudecode2.codefast.app"
MODEL = "GLM-5.1"

TURKISH_RE = re.compile(r'[ğüşıöçĞÜŞİÖÇ]')
VALID_EXT = {'.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.yml', '.yaml'}
SKIP_DIRS = {'node_modules', '.next', '.git', 'dist', 'build', '__pycache__'}
SKIP_FILES = {'book-language.ts'}

SYSTEM_PROMPT = """You are a Turkish-to-English translator for a Book Generator web app codebase.
Translate ONLY the Turkish text to English. Rules:
- Keep KDP, EPUB, PDF, AI, API as-is
- "Kitap Olusturucu" = "Book Generator"
- "Bolum" = "Chapter"
- Preserve ALL code syntax: variable names, function names, imports, JSX tags, HTML attributes, CSS classes
- Keep template literals like ${variable} and {variable} intact
- Keep URLs, email addresses, file paths as-is
- Return ONLY the translated text. No explanations, no markdown code blocks, no wrapping."""


def call_api(text):
    """Call GLM-5.1 API via curl with payload file"""
    payload = json.dumps({
        "model": MODEL,
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": text}]
    }, ensure_ascii=False)

    try:
        with open("_api_payload.json", "w", encoding="utf-8") as f:
            f.write(payload)

        r = subprocess.run(
            ["cmd", "/c", "curl", "-s", "--max-time", "60",
             "-X", "POST", f"{BASE_URL}/v1/messages",
             "-H", "Content-Type: application/json",
             "-H", f"x-api-key: {API_KEY}",
             "-H", "anthropic-version: 2023-06-01",
             "-d", "@_api_payload.json"],
            capture_output=True, timeout=65
        )

        if r.stdout:
            stdout_str = r.stdout.decode('utf-8', errors='replace')
            data = json.loads(stdout_str)
            result = data.get("content", [{}])[0].get("text", "")
            # Clean code block wrapping
            result = result.strip()
            if result.startswith("```") and result.endswith("```"):
                lines = result.split("\n")
                result = "\n".join(lines[1:-1]).strip()
            return result
        return ""

    except Exception as e:
        sys.stderr.write(f"API error: {str(e)[:100]}\n")
        return ""


def translate_text(text):
    """Translate a text string, return original if no Turkish"""
    if not text or not TURKISH_RE.search(text):
        return text
    result = call_api(text)
    return result if result else text


def translate_line(line, filepath=""):
    """Translate a single code line preserving structure"""
    if not TURKISH_RE.search(line):
        return line, False

    stripped = line.strip()
    indent = line[:len(line) - len(stripped)]
    changed = False

    # ── Strategy 1: Simple string literal replacement ──
    # Double-quoted strings: "turkish text"
    new_line = line
    for m in re.finditer(r'"([^"]*[ğüşıöçĞÜŞİÖÇ][^"]*)"', new_line):
        content = m.group(1)
        translated = translate_text(content)
        if translated and translated != content:
            new_line = new_line.replace(f'"{content}"', f'"{translated}"', 1)
            changed = True

    # Single-quoted strings: 'turkish text'
    for m in re.finditer(r"'([^']*[ğüşıöçĞÜŞİÖÇ][^']*)'", new_line):
        content = m.group(1)
        translated = translate_text(content)
        if translated and translated != content:
            new_line = new_line.replace(f"'{content}'", f"'{translated}'", 1)
            changed = True

    # Backtick strings: `turkish text`
    for m in re.finditer(r'`([^`]*[ğüşıöçĞÜŞİÖÇ][^`]*)`', new_line):
        content = m.group(1)
        translated = translate_text(content)
        if translated and translated != content:
            new_line = new_line.replace(f'`{content}`', f'`{translated}`', 1)
            changed = True

    # ── Strategy 2: JSX text nodes (text between > and <) ──
    # e.g. >Sayfa yüklenemedi</h1>
    if not changed:
        for m in re.finditer(r'>([^<{}]*[ğüşıöçĞÜŞİÖÇ][^<{}]*)<', new_line):
            content = m.group(1).strip()
            if content and TURKISH_RE.search(content):
                translated = translate_text(content)
                if translated and translated != content:
                    # Preserve whitespace around content
                    full = m.group(1)
                    lead_ws = full[:len(full) - len(full.lstrip())]
                    trail_ws = full[len(full.rstrip()):]
                    replacement = f">{lead_ws}{translated}{trail_ws}<"
                    new_line = new_line.replace(m.group(0), replacement, 1)
                    changed = True

    # ── Strategy 3: JSX text-only lines (bare text in JSX) ──
    if not changed and '>' not in stripped and '<' not in stripped:
        # Pure text line in JSX
        if TURKISH_RE.search(stripped):
            translated = translate_text(stripped)
            if translated and translated != stripped:
                new_line = indent + translated + '\n'
                changed = True

    # ── Strategy 4: Comments ──
    if not changed:
        if stripped.startswith('//'):
            comment = stripped[2:].strip()
            if TURKISH_RE.search(comment):
                translated = translate_text(comment)
                if translated and translated != comment:
                    new_line = indent + '// ' + translated + '\n'
                    changed = True
        elif stripped.startswith('*'):
            comment = stripped.lstrip('* ').rstrip()
            if TURKISH_RE.search(comment):
                translated = translate_text(comment)
                if translated and translated != comment:
                    new_line = indent + ' * ' + translated + '\n'
                    changed = True

    return new_line, changed


def translate_file(filepath, start=0, end=0):
    """Translate Turkish content in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"  [!] Read error: {e}", flush=True)
        return 0

    if end > 0:
        rng = range(max(0, start - 1), min(end, len(lines)))
    else:
        rng = range(len(lines))

    translated = 0
    for i in rng:
        if not TURKISH_RE.search(lines[i]):
            continue

        new_line, changed = translate_line(lines[i], filepath)
        if changed:
            lines[i] = new_line
            translated += 1
            short = new_line.strip()[:70]
            print(f"    L{i+1}: {short}", flush=True)
            time.sleep(0.15)  # Rate limit

    if translated > 0:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print(f"  [OK] {translated}/{sum(1 for i in rng if TURKISH_RE.search(lines[i])) if end else sum(1 for l in open(filepath,'r',encoding='utf-8').readlines() if TURKISH_RE.search(l))} lines", flush=True)
        except Exception as e:
            print(f"  [!] Write error: {e}", flush=True)
            return 0
    else:
        # Check if there are still Turkish lines
        remaining = sum(1 for i in rng if TURKISH_RE.search(lines[i]))
        if remaining > 0:
            print(f"  [??] {remaining} Turkish lines could not be translated", flush=True)
        else:
            print(f"  [--] Already clean", flush=True)

    return translated


# ─── SCANNING ────────────────────────────────────────────
def scan_files(root="web/src"):
    results = []
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            fp = os.path.join(dp, fn).replace('\\', '/')
            if not should_process(fp): continue
            c = count_turkish(fp)
            if c > 0: results.append((fp, c))
    results.sort(key=lambda x: x[1], reverse=True)
    return results

def should_process(fp):
    _, ext = os.path.splitext(fp)
    if ext.lower() not in VALID_EXT: return False
    if os.path.basename(fp) in SKIP_FILES: return False
    for d in SKIP_DIRS:
        if d in fp: return False
    return True

def count_turkish(fp):
    c = 0
    try:
        with open(fp, 'r', encoding='utf-8') as f:
            for line in f:
                if TURKISH_RE.search(line): c += 1
    except: pass
    return c


# ─── MAIN ────────────────────────────────────────────────
def main():
    print("=== TR->EN Translation Bot v4 ===", flush=True)

    if len(sys.argv) < 2:
        print("Commands: scan | translate | file <path> [start end] | batch <N> | test")
        return

    cmd = sys.argv[1]

    if cmd == "scan":
        files = scan_files()
        total = sum(c for _, c in files)
        print(f"\n{len(files)} files, {total} Turkish lines\n", flush=True)
        for fp, c in files:
            print(f"  {c:>4}  {fp}", flush=True)
        with open("scan_results.json", "w", encoding="utf-8") as f:
            json.dump([{"file": p, "lines": c} for p, c in files], f, indent=2, ensure_ascii=False)

    elif cmd == "translate":
        files = scan_files()
        total = sum(c for _, c in files)
        print(f"\n{len(files)} files, {total} lines\n", flush=True)
        total_done = 0
        for i, (fp, c) in enumerate(files):
            print(f"\n[{i+1}/{len(files)}] {fp} ({c} lines)", flush=True)
            n = translate_file(fp)
            total_done += n
            if (i+1) % 10 == 0:
                os.system('git add -A && git commit -m "translate batch"')
        print(f"\n=== DONE: {total_done} lines ===", flush=True)

    elif cmd == "batch":
        # Translate N files from scan results
        n_files = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        files = scan_files()
        total_done = 0
        for i, (fp, c) in enumerate(files[:n_files]):
            print(f"\n[{i+1}/{n_files}] {fp} ({c} lines)", flush=True)
            n = translate_file(fp)
            total_done += n
        print(f"\n=== Batch done: {total_done} lines in {min(n_files, len(files))} files ===", flush=True)

    elif cmd == "file":
        if len(sys.argv) < 3:
            print("Usage: python translate_bot.py file <path> [start end]", flush=True)
            return
        fp = sys.argv[2]
        s = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        e = int(sys.argv[4]) if len(sys.argv) > 4 else 0
        print(f"\nFile: {fp}", flush=True)
        translate_file(fp, s, e)

    elif cmd == "test":
        tests = [
            "Kitap Oluşturucu ile kitabını oluştur",
            "Bölüm 1: Giriş",
            "Ücretsiz önizleme",
            'const msg = "Hoş geldiniz";',
            "AI ile kitap yazma aracı",
            ">Sayfa yüklenemedi</h1>",
        ]
        print("\nTranslation Tests:\n", flush=True)
        for t in tests:
            r = translate_text(t)
            print(f"  TR: {t}", flush=True)
            print(f"  EN: {r}\n", flush=True)


if __name__ == "__main__":
    main()
