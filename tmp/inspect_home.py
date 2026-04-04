from pathlib import Path
lines = Path('web/src/app/page.tsx').read_text(encoding='utf-8').splitlines()
for start, end in [(94, 140), (156, 196)]:
    print('---', start, '---')
    for i, line in enumerate(lines[start:end], start + 1):
        print(f'{i:04d}: ' + line.encode('ascii', 'backslashreplace').decode('ascii'))
