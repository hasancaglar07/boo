"""Read all Turkish content blocks from marketing-data.ts to understand what needs translating."""
filepath = r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Print all lines with Turkish characters between lines 417 and end
turkish_char_set = set('ığüşöçİĞÜŞÖÇ')
in_turkish_block = False
block_start = 0

for i, line in enumerate(lines):
    has_turkish = any(c in line for c in turkish_char_set)
    if has_turkish:
        if not in_turkish_block:
            block_start = i
            in_turkish_block = True
    else:
        if in_turkish_block:
            print(f"--- Turkish block lines {block_start+1}-{i} ---")
            for j in range(block_start, i):
                print(f"  L{j+1}: {lines[j].strip()[:150]}")
            in_turkish_block = False

# Don't forget the last block
if in_turkish_block:
    print(f"--- Turkish block lines {block_start+1}-{len(lines)} ---")
    for j in range(block_start, len(lines)):
        print(f"  L{j+1}: {lines[j].strip()[:150]}")
