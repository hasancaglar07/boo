from pathlib import Path
files = [
    'web/src/lib/site-claims.ts',
    'web/src/app/page.tsx',
    'web/src/app/start/page.tsx',
    'web/src/components/site/start-option-cards.tsx',
    'web/src/components/site/premium-book-hero.tsx',
    'web/src/app/examples/page.tsx',
    'web/src/components/site/examples-showcase.tsx',
    'web/src/app/contact/page.tsx',
    'web/src/components/site/contact-form.tsx',
    'web/src/app/login/page.tsx',
    'web/src/app/signup/page.tsx',
    'web/src/app/pricing/page.tsx',
    'web/src/app/about/page.tsx',
    'web/src/components/site/site-header.tsx',
    'web/src/components/site/site-footer.tsx',
]
needles = ['preview','Preview','KDP','iade','ödeme','Ücretsiz','ücretsiz','5 kısa soru','5 soruda','Süreç netliği','Ek export','Aynı akışta üretim','Bu ekran ödeme duvarı değildir']
for f in files:
    txt = Path(f).read_text(encoding='utf-8')
    hits = [n for n in needles if n in txt]
    print(f'===== {f} =====')
    print(', '.join(hits) if hits else 'no tracked keywords')
    print()
