#!/usr/bin/env python3
"""Detailed scan of web/ directory Turkish lines."""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TURKISH_RE = re.compile(r'[ığüşöçİĞÜŞÖÇ]')

ROOT = r'C:\Users\ihsan\Desktop\BOOK'

# Only web/ files
targets = [
    r'web\src\lib\marketing-tools.ts',
    r'web\src\lib\marketing-data.ts',
    r'web\src\lib\book-language.ts',
    r'web\src\lib\dashboard-api.ts',
    r'web\src\app\blog\[slug]\page.tsx',
    r'web\src\lib\funnel-draft.ts',
    r'web\src\components\app\app-frame.tsx',
    r'web\src\components\app\wizard-screen.tsx',
    r'web\src\components\app\workspace-screen.tsx',
    r'web\src\components\funnel\book-preview-screen.tsx',
    r'web\src\components\site\book-idea-validator-tool.tsx',
    r'web\src\components\ui\button.tsx',
    r'web\src\components\ui\cta-4.tsx',
    r'web\src\lib\kdp-snippet.txt',
]

for relpath in targets:
    filepath = os.path.join(ROOT, relpath)
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {relpath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    matches = []
    for i, line in enumerate(lines, 1):
        if TURKISH_RE.search(line):
            matches.append((i, line.rstrip('\n\r')[:160]))
    
    if matches:
        print(f"\n{'='*80}")
        print(f"FILE: {relpath} ({len(matches)} Turkish lines)")
        print(f"{'='*80}")
        for lineno, text in matches:
            print(f"  L{lineno:4d}: {text}")
