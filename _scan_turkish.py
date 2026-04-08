#!/usr/bin/env python3
"""Scan all text files in the project for Turkish characters."""
import os
import re

# Turkish-specific characters
TURKISH_RE = re.compile(r'[ığüşöçİĞÜŞÖÇ]')

# Directories to skip
SKIP_DIRS = {
    'node_modules', '.next', '.git', 'dist', 'build', '.cache',
    'vendor', 'preview', 'test_cover_output', 'tmp',
    'covers', 'micro-influence-images', 'playful-path-images',
    'showcase-covers', 'logos', 'images',
    'migrations', '.agent', '.prisma',
}

# File extensions to check
CHECK_EXTS = {
    '.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json',
    '.sh', '.py', '.bat', '.ps1', '.yaml', '.yml',
    '.html', '.txt', '.mjs', '.cjs', '.prisma',
}

import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = r'C:\Users\ihsan\Desktop\BOOK'

results = {}  # filepath -> [(line_no, line_text)]

for dirpath, dirnames, filenames in os.walk(ROOT):
    # Skip directories in-place
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]

    for fn in filenames:
        ext = os.path.splitext(fn)[1].lower()
        if ext not in CHECK_EXTS:
            continue

        filepath = os.path.join(dirpath, fn)
        relpath = os.path.relpath(filepath, ROOT)

        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f, 1):
                    if TURKISH_RE.search(line):
                        stripped = line.rstrip('\n\r')
                        # Only show first 150 chars
                        display = stripped[:150]
                        if filepath not in results:
                            results[filepath] = []
                        results[filepath].append((i, display))
        except Exception:
            pass

# Print results grouped by file
for filepath in sorted(results.keys()):
    relpath = os.path.relpath(filepath, ROOT)
    matches = results[filepath]
    print(f"\n{'='*80}")
    print(f"FILE: {relpath} ({len(matches)} lines with Turkish)")
    print(f"{'='*80}")
    for lineno, text in matches:
        print(f"  L{lineno:4d}: {text}")

print(f"\n\nTOTAL: {len(results)} files contain Turkish characters, {sum(len(v) for v in results.values())} lines total")
