#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Dump all Turkish lines from marketing-data.ts for translation."""
import re, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

FILE = os.path.join('web', 'src', 'lib', 'marketing-data.ts')
with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

tr = re.compile(r'[\u0131\u011f\u00fc\u015f\u00f6\u00e7\u0130\u011e\u00dc\u015e\u00d6\u00c7]')

# Dump each Turkish line to its own file
found = []
for i, line in enumerate(lines):
    if tr.search(line):
        found.append(i)
        with open(f'_tr_line_{i+1}.txt', 'w', encoding='utf-8') as out:
            out.write(line.rstrip())

print(f"Dumped {len(found)} Turkish lines")
for idx in found:
    print(f"  L{idx+1}")
