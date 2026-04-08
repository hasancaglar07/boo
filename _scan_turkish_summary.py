#!/usr/bin/env python3
"""Summarize Turkish content by directory group."""
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TURKISH_RE = re.compile(r'[ığüşöçİĞÜŞÖÇ]')

SKIP_DIRS = {
    'node_modules', '.next', '.git', 'dist', 'build', '.cache',
    'vendor', 'preview', 'test_cover_output',
    'covers', 'micro-influence-images', 'playful-path-images',
    'showcase-covers', 'logos', 'images',
    'migrations', '.agent', '.prisma',
    'book_research_data', 'cover-experiments', 'cover-experiments-v2',
    'cover-lab', 'hybrid-cover-audit', 'vertex-cover-bake',
    'vertex-text-on-cover-test', 'public',
}

CHECK_EXTS = {
    '.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.json',
    '.sh', '.py', '.bat', '.ps1', '.yaml', '.yml',
    '.html', '.txt', '.mjs', '.cjs', '.prisma',
}

ROOT = r'C:\Users\ihsan\Desktop\BOOK'

# Group results by top-level directory
group_stats = {}  # group -> {file_count, line_count, files: {relpath: line_count}}

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]

    for fn in filenames:
        ext = os.path.splitext(fn)[1].lower()
        if ext not in CHECK_EXTS:
            continue

        filepath = os.path.join(dirpath, fn)
        relpath = os.path.relpath(filepath, ROOT)

        # Determine group
        parts = relpath.replace('\\', '/').split('/')
        if parts[0] == 'web':
            group = 'web/'
        elif parts[0] == 'scripts':
            group = 'scripts/'
        elif parts[0] == 'tasks':
            group = 'tasks/'
        elif parts[0] == 'data':
            group = 'data/'
        elif parts[0] == 'deploy':
            group = 'deploy/'
        elif parts[0] == 'auto-inspector':
            group = 'auto-inspector/'
        elif parts[0] == 'docker':
            group = 'docker/'
        elif parts[0] == 'tests':
            group = 'tests/'
        else:
            group = 'root/'

        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                count = 0
                for line in f:
                    if TURKISH_RE.search(line):
                        count += 1
                if count > 0:
                    if group not in group_stats:
                        group_stats[group] = {'file_count': 0, 'line_count': 0, 'files': {}}
                    group_stats[group]['file_count'] += 1
                    group_stats[group]['line_count'] += count
                    group_stats[group]['files'][relpath] = count
        except Exception:
            pass

# Print summary
print("=" * 70)
print("TURKISH CONTENT SUMMARY BY DIRECTORY GROUP")
print("=" * 70)
for group in sorted(group_stats.keys()):
    stats = group_stats[group]
    print(f"\n{group} — {stats['file_count']} files, {stats['line_count']} lines")
    # Top 10 files by line count
    sorted_files = sorted(stats['files'].items(), key=lambda x: -x[1])
    for relpath, count in sorted_files[:15]:
        print(f"  {count:5d} lines: {relpath}")
    if len(sorted_files) > 15:
        print(f"  ... and {len(sorted_files) - 15} more files")

total_files = sum(s['file_count'] for s in group_stats.values())
total_lines = sum(s['line_count'] for s in group_stats.values())
print(f"\n{'='*70}")
print(f"TOTAL: {total_files} files, {total_lines} lines across {len(group_stats)} groups")
