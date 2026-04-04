from pathlib import Path
files = [
    'web/src/lib/site-claims.ts',
    'web/src/app/page.tsx',
    'web/src/app/start/page.tsx',
    'web/src/components/site/start-option-cards.tsx',
    'web/src/components/site/premium-book-hero.tsx',
    'web/src/app/examples/page.tsx',
    'web/src/app/contact/page.tsx',
    'web/src/components/site/contact-form.tsx',
    'web/src/app/login/page.tsx',
    'web/src/app/signup/page.tsx',
    'web/src/app/pricing/page.tsx',
    'web/src/app/about/page.tsx',
    'web/src/components/site/site-header.tsx',
    'web/src/components/site/site-footer.tsx',
]
for f in files:
    p = Path(f)
    txt = p.read_text(encoding='utf-8', errors='replace')
    print(f"{f}: bad_char={'�' in txt}, lines={len(txt.splitlines())}")
