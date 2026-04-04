from pathlib import Path
spec = {
'web/src/lib/site-claims.ts':[(1,20)],
'web/src/app/page.tsx':[(90,170),(180,210)],
'web/src/app/start/page.tsx':[(15,80)],
'web/src/components/site/start-option-cards.tsx':[(9,35)],
'web/src/components/site/premium-book-hero.tsx':[(284,305),(404,456)],
'web/src/app/examples/page.tsx':[(43,90)],
'web/src/app/contact/page.tsx':[(20,70)],
'web/src/components/site/contact-form.tsx':[(100,130)],
'web/src/app/login/page.tsx':[(24,60)],
'web/src/app/signup/page.tsx':[(24,60)],
'web/src/app/pricing/page.tsx':[(80,110),(186,205),(288,350),(406,452)],
'web/src/app/about/page.tsx':[(100,130),(198,206)],
'web/src/components/site/site-header.tsx':[(16,25),(96,107)],
'web/src/components/site/site-footer.tsx':[(14,120)],
}
for f, ranges in spec.items():
    print('===== ' + f + ' =====')
    lines = Path(f).read_text(encoding='utf-8').splitlines()
    for start, end in ranges:
        print(f'--- {start}-{end} ---')
        for i in range(start - 1, min(end, len(lines))):
            print(f'{i+1:04d}: ' + lines[i].encode('ascii', 'backslashreplace').decode('ascii'))
