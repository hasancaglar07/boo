from pathlib import Path
text = Path('web/src/app/pricing/page.tsx').read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), 1):
    if any(key in line for key in ['30 kitap/ay', 'Kanıtlanmış süreç', 'KDP onaylı kitap canlıda', 'soru sormadan', 'HTML ve Markdown', 'checkout', 'HTML çıktısı dahil', 'KDP_LIVE_BOOK_COUNT']):
        print(f'{i:04d}: ' + line.encode('ascii','backslashreplace').decode('ascii'))
