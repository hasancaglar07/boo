# ACTION PLAN

## Immediate

1. Done: fixed site URL resolution so canonical, Open Graph, robots, sitemap and `llms.txt` outputs use `https://bookgenerator.net`.
2. Done: expanded `robots.txt` with explicit AI/search crawler directives and allowed `llms` + OG endpoints.
3. Done: added `llms.txt` and `llms-full.txt`.
4. Done: made example detail pages crawlable and discoverable via SSG + sitemap.
5. Done: removed low-signal schema (`SearchAction`, site-wide `speakable`) and added stronger example-page schema.

## Secondary

1. Done: added baseline security headers in `next.config.ts`.
2. Done: replaced rolling sitemap timestamps with stable default values and content dates where available.
3. Done: re-ran build verification and confirmed corrected output against local production render.
4. Next pass: add a safe `Content-Security-Policy` after auditing third-party and inline script requirements.
5. Next pass: clean up the Turbopack/NFT tracing warning from the example asset route.

## Validation Checklist

- `robots.txt` shows production host and explicit crawler policy
- `sitemap.xml` no longer contains `localhost`
- `llms.txt` and `llms-full.txt` return `200`
- example routes are present in sitemap
- example detail pages render with valid canonical and structured data
- `npm run build` succeeds
