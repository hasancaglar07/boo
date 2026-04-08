"""Fix remaining Turkish strings - read exact bytes from file."""
import re

filepath = r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Print exact content of lines 436 and 455
for i in [435, 454]:
    print(f"Line {i+1}: [{lines[i]}]")

# Find and replace the KDP title
# Line 436: title with Turkish chars
kdp_title_line = lines[435]
print(f"\nKDP title line repr: {repr(kdp_title_line.strip())}")

# Find and replace the summary line  
# Line 455: summary with Turkish chars
summary_line = lines[454]
print(f"Summary line repr: {repr(summary_line.strip())}")

# Let's find all Turkish lines and fix them with regex
# First find the KDP title
for i, line in enumerate(lines):
    if 'Ne Kontrol Etmeli' in line:
        print(f"\nFound KDP title at line {i+1}: {repr(line.strip()[:80])}")
    if 'korkusuna' in line:
        print(f"Found summary at line {i+1}: {repr(line.strip()[:80])}")
