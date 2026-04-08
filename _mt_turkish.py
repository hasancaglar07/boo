#!/usr/bin/env python3
"""Extract all Turkish lines from marketing-tools.ts for translation."""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

filepath = r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-tools.ts'
TURKISH_RE = __import__('re').compile(r'[ığüşöçİĞÜŞÖÇ]')

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if TURKISH_RE.search(line):
        print(f"L{i}: {line.rstrip()[:200]}")
