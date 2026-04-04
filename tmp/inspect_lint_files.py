from pathlib import Path
files = {
    'web/src/components/app/cookie-consent.tsx': [(1, 120)],
    'web/src/components/funnel/generate-auth-gate-dialog.tsx': [(1, 120)],
    'web/src/components/funnel/generate-loading-screen.tsx': [(1, 160)],
    'web/src/components/onboarding/onboarding-checklist.tsx': [(1, 220)],
    'web/src/app/refund-policy/page.tsx': [(1, 120)],
    'web/src/components/site/affiliate-page.tsx': [(1, 160)],
    'web/src/components/site/lead-magnet-signup-card.tsx': [(130, 180)],
    'web/src/app/how-it-works/page.tsx': [(1, 30)],
    'web/src/app/api/referral/my-code/route.ts': [(1, 40)],
    'web/src/lib/examples-data.ts': [(120, 160)],
}
for f, ranges in files.items():
    lines = Path(f).read_text(encoding='utf-8').splitlines()
    print('===== ' + f + ' =====')
    for start, end in ranges:
        print(f'--- {start}-{end} ---')
        for i in range(start - 1, min(end, len(lines))):
            print(f'{i+1:04d}: ' + lines[i].encode('ascii', 'backslashreplace').decode('ascii'))
    print()
