#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TR->EN Translation Bot v6 - Line-based
Simpler approach: translate entire lines that contain Turkish text.
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

TR_CHARS = set("ğüşöçıĞÜŞÖÇİ")
SKIP_DIRS = {"node_modules", ".next", ".git", "dist", "build"}
SKIP_FILES = {
    "translate_bot.py", "translate_bot_v5.py", "translate_bot_v6.py",
    "fix_layout.py", "lang-provider.tsx", "book-language.ts"
}

# Common translations dictionary for speed
DICT = {
    # Nav / UI
    "Nasıl Çalışır": "How It Works",
    "Örnekler": "Examples",
    "Fiyatlar": "Pricing",
    "Karşılaştır": "Compare",
    "SSS": "FAQ",
    "Araçlar": "Tools",
    "Kaynaklar": "Resources",
    "Kullanım Alanları": "Use Cases",
    "Giriş Yap": "Log In",
    "Kitaplarım": "My Books",
    "Yeni Kitap": "New Book",
    "Ücretsiz Önizleme": "Free Preview",
    "Daha Fazla": "More",
    "Menüyü kapat": "Close menu",
    "Menüyü aç": "Open menu",
    "Ana içeriğe geç": "Skip to main content",
    # Common words
    "Kitap": "Book",
    "Bölüm": "Chapter",
    "Oluşturucu": "Creator",
    "oluşturucu": "creator",
    "Başlık": "Title",
    "başlık": "title",
    "Açıklama": "Description",
    "açıklama": "description",
    "Yazar": "Author",
    "yazar": "author",
    "İçindekiler": "Table of Contents",
    "Giriş": "Introduction",
    "Sonuç": "Conclusion",
    "Hata": "Error",
    "hata": "error",
    "Yükleniyor": "Loading",
    "yükleniyor": "loading",
    "Kaydet": "Save",
    "kaydet": "save",
    "İptal": "Cancel",
    "iptal": "cancel",
    "Sil": "Delete",
    "sil": "delete",
    "Düzenle": "Edit",
    "düzenle": "edit",
    "Kapat": "Close",
    "kapat": "close",
    "Geri": "Back",
    "geri": "back",
    "Devam": "Continue",
    "devam": "continue",
    "Ayarlar": "Settings",
    "ayarlar": "settings",
    "Profil": "Profile",
    "profil": "profile",
    "Faturalama": "Billing",
    "faturalama": "billing",
    "Abonelik": "Subscription",
    "abonelik": "subscription",
    "Destek": "Support",
    "destek": "support",
    "İletişim": "Contact",
    "iletişim": "contact",
    "Gizlilik": "Privacy",
    "gizlilik": "privacy",
    "Şartlar": "Terms",
    "şartlar": "terms",
    "İade": "Refund",
    "iade": "refund",
    "Hakkımızda": "About Us",
    "hakkımızda": "about us",
    "Blog": "Blog",
    "blog": "blog",
    "Güvenlik": "Security",
    "güvenlik": "security",
    "Şifre": "Password",
    "şifre": "password",
    "E-posta": "Email",
    "Telefon": "Phone",
    "Adres": "Address",
    "Tarih": "Date",
    "Süre": "Duration",
    "Fiyat": "Price",
    "fiyat": "price",
    "Toplam": "Total",
    "toplam": "total",
    "Ücret": "Fee",
    "ücret": "fee",
    "Ücretsiz": "Free",
    "ücretsiz": "free",
    "Premium": "Premium",
    "Profesyonel": "Professional",
    "Başlangıç": "Starter",
    "başlangıç": "starter",
}


def call_api(prompt):
    """Call GLM-5.1 API, return text."""
    payload = json.dumps({
        "model": MODEL,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}]
    })

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
            capture_output=True, timeout=120
        )
    except subprocess.TimeoutExpired:
        os.unlink(tmp.name)
        return None
    finally:
        try:
            os.unlink(tmp.name)
        except:
            pass

    try:
        data = json.loads(result.stdout.decode("utf-8"))
        return data["content"][0]["text"]
    except:
        return None


def has_turkish(text):
    return any(c in TR_CHARS for c in text)


def is_code_only(line):
    """Check if line is purely code (no translatable text)."""
    stripped = line.strip()
    # Skip import/export lines
    if stripped.startswith(("import ", "export ", "from ", "const ", "let ", "var ", "function ", "class ", "interface ", "type ")):
        # But check if it has Turkish in strings
        if not has_turkish(stripped):
            return True
    return False


def translate_lines_batch(lines_with_idx):
    """Translate a batch of lines via API."""
    if not lines_with_idx:
        return {}

    # Build prompt
    numbered = []
    for i, (idx, line) in enumerate(lines_with_idx):
        numbered.append(f"LINE {i+1}:\n{line}")

    block = "\n\n".join(numbered)

    prompt = f"""You are a code translator. Translate Turkish text to English in these code lines.

RULES:
- Only translate Turkish text (words with ğ,ü,ş,ö,ç,ı,İ characters)
- Keep ALL code syntax, HTML/JSX tags, CSS classes, variable names, imports, exports unchanged
- Keep string quotes intact ("..." or '...' or `...`)
- Keep technical terms: KDP, EPUB, PDF, API, AI, GPT, ChatGPT, Stripe, etc.
- "Book Generator" or "Kitap Olusturucu" stays as is
- Output ONLY the translated lines with same LINE N format
- One line per LINE N block

{block}"""

    response = call_api(prompt)
    if not response:
        return {}

    # Parse response - map back to original indices
    translations = {}
    current_num = None
    current_text = []

    for resp_line in response.split("\n"):
        m = re.match(r'LINE\s+(\d+):\s*$', resp_line)
        if m:
            if current_num is not None and current_text:
                translations[current_num] = "\n".join(current_text)
            current_num = int(m.group(1))
            current_text = []
        elif current_num is not None:
            current_text.append(resp_line)

    if current_num is not None and current_text:
        translations[current_num] = "\n".join(current_text)

    return translations


def translate_file(filepath):
    """Translate all Turkish lines in a file."""
    if not os.path.exists(filepath):
        print(f"  FILE NOT FOUND", flush=True)
        return 0

    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Find Turkish lines
    turkish_lines = []
    for i, line in enumerate(lines):
        if has_turkish(line) and line.strip():
            turkish_lines.append((i, line.rstrip("\n")))

    if not turkish_lines:
        print(f"  CLEAN", flush=True)
        return 0

    print(f"  {len(turkish_lines)} Turkish lines", flush=True)

    # Translate in batches of 5 lines
    total_changes = 0
    batch_size = 5

    for batch_start in range(0, len(turkish_lines), batch_size):
        batch = turkish_lines[batch_start:batch_start + batch_size]
        batch_num = batch_start // batch_size + 1
        total_batches = (len(turkish_lines) + batch_size - 1) // batch_size

        print(f"  Batch {batch_num}/{total_batches} ({len(batch)} lines)...", end="", flush=True)

        translations = translate_lines_batch(batch)

        applied = 0
        for i, (idx, orig) in enumerate(batch):
            if i in translations:
                new_line = translations[i]
                # Verify the translation doesn't break code structure
                if new_line.strip() and len(new_line.strip()) > 2:
                    lines[idx] = new_line + "\n"
                    applied += 1

        print(f" {applied}/{len(batch)} applied", flush=True)
        total_changes += applied
        time.sleep(1)

    if total_changes > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(lines)
        print(f"  SAVED {total_changes} changes", flush=True)
    else:
        print(f"  NO changes saved", flush=True)

    return total_changes


def scan_files(root="web/src"):
    """Scan for files with Turkish content."""
    results = []
    for dirpath, dirnames, filenames in os.walk(root):
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
            except:
                pass
    results.sort(key=lambda x: -x[1])
    return results


def main():
    if len(sys.argv) < 2:
        print("TR->EN Translation Bot v6")
        print("Commands:")
        print("  scan              - List files with Turkish")
        print("  translate <file>  - Translate one file")
        print("  batch <n>         - Translate top N files")
        print("  all               - Translate everything")
        print("  count             - Quick count")
        return

    cmd = sys.argv[1]

    if cmd == "scan":
        results = scan_files()
        total = sum(c for _, c in results)
        print(f"{len(results)} files, {total} Turkish lines\n")
        for fpath, count in results:
            print(f"  {count:>5}  {fpath}")

    elif cmd == "translate":
        filepath = sys.argv[2]
        print(f"Translating: {filepath}")
        changes = translate_file(filepath)
        print(f"Done: {changes} changes")

    elif cmd == "batch":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        results = scan_files()
        top_n = results[:n]
        total = 0
        for i, (fpath, count) in enumerate(top_n):
            print(f"\n[{i+1}/{n}] {fpath} ({count} lines)")
            changes = translate_file(fpath)
            total += changes
            time.sleep(2)
        print(f"\nBatch done: {total} changes in {n} files")

    elif cmd == "all":
        results = scan_files()
        total = 0
        for i, (fpath, count) in enumerate(results):
            print(f"\n[{i+1}/{len(results)}] {fpath} ({count} lines)")
            changes = translate_file(fpath)
            total += changes
            time.sleep(2)
        print(f"\nALL DONE: {total} changes in {len(results)} files")

    elif cmd == "count":
        results = scan_files()
        total = sum(c for _, c in results)
        print(f"{len(results)} files, {total} Turkish lines remaining")

    else:
        print(f"Unknown: {cmd}")


if __name__ == "__main__":
    main()
