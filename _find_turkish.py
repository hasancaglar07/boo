with open(r'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find Turkish slugs and their line numbers
for i, line in enumerate(lines):
    if 'slug:' in line and any(tk in line for tk in ['epub-ve', 'kdpye', 'yazmayi', 'kitap-fikri', 'ilk-kitabim-kac', 'chatgpt-ile']):
        print(f'Line {i+1}: {line.strip()}')
    if 'category:' in line and any(tk in line for tk in ['Yayın', 'KDP', 'Başlangıç', 'Yapı']):
        print(f'Line {i+1}: {line.strip()}')
    if 'readTime:' in line and 'dk' in line:
        print(f'Line {i+1}: {line.strip()}')
