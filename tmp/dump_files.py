from pathlib import Path
files = [
    'web/src/app/start/page.tsx',
    'web/src/components/site/contact-form.tsx',
    'web/src/app/login/page.tsx',
    'web/src/app/signup/page.tsx',
]
for f in files:
    print('===== ' + f + ' =====')
    print(Path(f).read_text(encoding='utf-8').encode('ascii', 'backslashreplace').decode('ascii'))
    print()
