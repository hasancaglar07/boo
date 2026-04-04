from pathlib import Path
files = [
    'web/src/components/app/cookie-consent.tsx',
    'web/src/components/funnel/generate-auth-gate-dialog.tsx',
    'web/src/components/funnel/generate-loading-screen.tsx',
    'web/src/components/onboarding/onboarding-checklist.tsx',
    'web/src/app/refund-policy/page.tsx',
    'web/src/components/site/affiliate-page.tsx',
    'web/src/components/site/lead-magnet-signup-card.tsx',
    'web/src/app/how-it-works/page.tsx',
    'web/src/app/api/referral/my-code/route.ts',
    'web/src/lib/examples-data.ts',
]
for f in files:
    p = Path(f)
    print('===== ' + f + ' =====')
    print(p.read_text(encoding='utf-8').encode('ascii', 'backslashreplace').decode('ascii'))
    print()
