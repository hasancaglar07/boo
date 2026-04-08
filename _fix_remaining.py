"""Fix remaining Turkish strings using exact match from file."""
import re

filepath = r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

# Fix line 436 (index 435): KDP title
lines[435] = '    title: "What to Check Before Uploading to KDP?",'

# Fix line 455 (index 454): summary
lines[454] = '    summary: "Provides the simplest answer to first-time user fear.",'

content = '\n'.join(lines)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed 2 remaining lines.")
