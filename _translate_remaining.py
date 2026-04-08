#!/usr/bin/env python3
"""Replace remaining Turkish blog content with English translations in marketing-data.ts"""
import re

translations = {
    # KDP pre-upload blog sections
    '"Metadata net mi?"': '"Is your metadata clear?"',
    '"Kategori ve anahtar kelimeler seçildi mi?"': '"Are categories and keywords selected?"',
    '"İçerik akışı temiz mi?"': '"Is the content flow clean?"',
    '"Kapak KDP gereksinimlerini karşılıyor mu?"': '"Does the cover meet KDP requirements?"',
    '"Dosya teknik olarak sorunsuz mu?"': '"Is the file technically sound?"',
    '"Yayın öncesi son tur"': '"Final pre-publish review"',
}

with open('web/src/lib/marketing-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Count remaining Turkish
pat = re.compile('[\u0131\u011f\u00fc\u015f\u00f6\u00e7\u0130\u011e\u00dc\u015e\u00d6\u00c7]')
lines = content.split('\n')
turkish_lines = [(i+1, l) for i, l in enumerate(lines) if pat.search(l)]
print(f"Turkish lines before: {len(turkish_lines)}")
for n, l in turkish_lines[:5]:
    print(f"  {n}: {l[:80].strip()}")

# Apply section title translations
for old, new in translations.items():
    content = content.replace(old, new)

# Write back
with open('web/src/lib/marketing-data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

# Recount
lines = content.split('\n')
turkish_lines = [(i+1, l) for i, l in enumerate(lines) if pat.search(l)]
print(f"\nTurkish lines after section title fixes: {len(turkish_lines)}")
print("\nRemaining Turkish lines are in blog post body content (intro + section text).")
print("These need manual translation of the full paragraphs.")
