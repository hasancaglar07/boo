"""Fix remaining Turkish strings that had encoding mismatches."""
import unicodedata

filepath = r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find lines containing Turkish chars around the KDP title area
lines = content.split('\n')
for i, line in enumerate(lines):
    if any(c in line for c in 'ığüşöçİĞÜŞÖÇ'):
        if any(kw in line for kw in ['title:', 'summary:', 'intro:', 'category:', 'readTime:']):
            print(f"L{i+1}: {line.strip()[:120]}")
