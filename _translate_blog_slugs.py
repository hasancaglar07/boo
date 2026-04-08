"""Translate Turkish blog posts in marketing-data.ts to English."""
import re

filepath = r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = []

# ============================================================
# 1. epub-ve-pdf-farki (line ~417)
# ============================================================
replacements.append((
    'slug: "epub-ve-pdf-farki"',
    'slug: "epub-vs-pdf-difference"',
))

replacements.append((
    'title: "EPUB ve PDF Farkı Nedir?"',
    'title: "What Is the Difference Between EPUB and PDF?"',
))

replacements.append((
    'summary: "İlk kullanıcı için hangi formatın ne zaman doğru olduğunu açıklar."',
    'summary: "Explains which format is right and when for first-time users."',
))

replacements.append((
    'category: "Yayın"',
    'category: "Publishing"',
))

# ============================================================
# 2. kdpye-yuklemeden-once-ne-kontrol-etmeli (line ~435)
# ============================================================
replacements.append((
    'slug: "kdpye-yuklemeden-once-ne-kontrol-etmeli"',
    'slug: "what-to-check-before-uploading-to-kdp"',
))

replacements.append((
    'title: "KDP\'ye Yüklemeden Önce Ne Kontrol Etmeli?"',
    'title: "What to Check Before Uploading to KDP?"',
))

replacements.append((
    'summary: "Yayın öncesi kısa ama pratik bir kontrol mantığı sunar."',
    'summary: "Provides a short but practical pre-publish checklist."',
))

replacements.append((
    'category: "KDP"',
    'category: "KDP"',
))

replacements.append((
    'readTime: "7 dk"',
    'readTime: "7 min"',
))

# ============================================================
# 3. yazmayi-bilmeden-kitap-cikarabilir-miyim (line ~453)
# ============================================================
replacements.append((
    'slug: "yazmayi-bilmeden-kitap-cikarabilir-miyim"',
    'slug: "can-i-publish-a-book-without-knowing-how-to-write"',
))

replacements.append((
    'title: "Yazmayı Bilmeden Kitap Çıkarabilir miyim?"',
    'title: "Can I Publish a Book Without Knowing How to Write?"',
))

replacements.append((
    'summary: "İlk kullanıcı korkusuna en basit yanıt verir."',
    'summary: "Provides the simplest answer to first-time user fear."',
))

replacements.append((
    'category: "Başlangıç"',
    'category: "Getting Started"',
))

# ============================================================
# 4. kitap-fikri-nasil-secilir (line ~471)
# ============================================================
replacements.append((
    'slug: "kitap-fikri-nasil-secilir"',
    'slug: "how-to-choose-a-book-idea"',
))

replacements.append((
    'summary: "Ties topic selection not just to inspiration, but to reader and need alignment."',
    'summary: "Ties topic selection not just to inspiration, but to reader and need alignment."',
))

# ============================================================
# 5. ilk-kitabim-kac-bolum-olmali (line ~509)
# ============================================================
replacements.append((
    'slug: "ilk-kitabim-kac-bolum-olmali"',
    'slug: "how-many-chapters-should-my-first-book-have"',
))

replacements.append((
    'title: "İlk Kitabım Kaç Bölüm Olmalı?"',
    'title: "How Many Chapters Should My First Book Have?"',
))

replacements.append((
    'summary: "İlk kitapta fazla bölüm açmanın neden çoğu zaman hata olduğunu açıklar."',
    'summary: "Explains why having too many chapters in your first book is usually a mistake."',
))

replacements.append((
    'category: "Yapı"',
    'category: "Structure"',
))

# ============================================================
# 6. chatgpt-ile-outline-cikiyor-ama-kitap-neden-bitmiyor (line ~565)
# ============================================================
replacements.append((
    'slug: "chatgpt-ile-outline-cikiyor-ama-kitap-neden-bitmiyor"',
    'slug: "chatgpt-generates-outlines-but-why-doesnt-the-book-get-finished"',
))

replacements.append((
    'category: "Başlangıç"',
    'category: "Getting Started"',
))

replacements.append((
    'readTime: "7 dk"',
    'readTime: "7 min"',
))

# ============================================================
# Apply simple replacements
# ============================================================
applied = 0
missed = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new, 1)
        applied += 1
        print(f"  OK: {old[:60]}")
    else:
        missed += 1
        print(f"  MISS: {old[:60]}")

print(f"\nApplied: {applied}, Missed: {missed}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Saved.")
