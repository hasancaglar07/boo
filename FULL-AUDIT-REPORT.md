# FULL AUDIT REPORT

## Scope

- Project: `web/` Next.js marketing site for Book Generator / Kitap Olusturucu
- Audit date: 2026-04-03
- Audit type: technical SEO + on-page SEO + AI SEO
- Evidence sources:
  - local code review
  - local production build on `http://127.0.0.1:3005`
  - live checks against `https://bookgenerator.net`
  - Google Search Central and OpenAI crawler documentation

## Executive Summary

Overall status: **Significantly Improved**

Top issues confirmed before fixes:

1. **Critical**: sitemap URLs resolve to `http://localhost:3000` in both local build output and the live `https://bookgenerator.net/sitemap.xml`.
2. **High**: `robots.txt` does not explicitly manage AI/search crawlers and there is no `llms.txt`.
3. **High**: public example detail pages are missing from sitemap and are not statically generated for crawl-friendly discovery.
4. **Medium**: site-wide structured data includes a `SearchAction` that points to a non-existent search experience and a `speakable` implementation that is not aligned with Google's intended use.
5. **Medium**: several useful security headers are missing.

## Confirmed Findings

### 1. Localhost leakage in sitemap

- Severity: Critical
- Confidence: Confirmed
- Evidence:
  - `curl -sS https://bookgenerator.net/sitemap.xml` returns `<loc>http://localhost:3000/...`
  - local render on `http://127.0.0.1:3005/sitemap.xml` returns the same localhost URLs
- Impact:
  - wrong canonical sitemap targets can dilute indexation and waste crawl budget
  - search engines receive invalid production URL signals
- Fix:
  - harden site URL resolution with a production-safe fallback
  - regenerate sitemap from the corrected canonical base

### 2. AI crawler management is incomplete

- Severity: High
- Confidence: Confirmed
- Evidence:
  - `robots_checker.py` reports GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended and others are not explicitly managed
  - live `robots.txt` only exposes a generic `User-Agent: *` block
- Impact:
  - weak control over AI discovery/citation behavior
  - missed opportunity to explicitly allow search/citation bots while handling training bots intentionally
- Fix:
  - add explicit rules for `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`
  - add a deliberate policy for training-oriented bots

### 3. No `llms.txt`

- Severity: High
- Confidence: Confirmed
- Evidence:
  - `llms_txt_checker.py http://127.0.0.1:3005` returns `404`
- Impact:
  - weaker AI-readable site summary and lower extractability for agent-style crawlers
- Fix:
  - add `llms.txt` and `llms-full.txt` routes with product, audience, and key URL summaries

### 4. Example library discoverability is weak

- Severity: High
- Confidence: Confirmed
- Evidence:
  - `web/src/app/sitemap.ts` does not include `/examples/[slug]`
  - `web/src/app/examples/page.tsx` and `web/src/app/examples/[slug]/page.tsx` force dynamic rendering
- Impact:
  - 30 showcase/example assets are harder to discover and cache
  - valuable proof pages are under-leveraged for SEO and AI citation
- Fix:
  - statically generate example pages with `generateStaticParams`
  - add example URLs to sitemap
  - add book/breadcrumb structured data

### 5. Site-wide schema contains low-value / misaligned pieces

- Severity: Medium
- Confidence: Confirmed
- Evidence:
  - `layout.tsx` emits `SearchAction` for `/blog?query=...` but no real public search experience exists
  - `layout.tsx` emits `speakable` markup site-wide
  - Google Search Central's speakable guidance is for news-content use cases
- Impact:
  - weaker schema quality
  - potential confusion for parsers and unnecessary structured-data noise
- Fix:
  - remove invalid/low-signal schema
  - keep organization/website/software app markup aligned to real site behavior

### 6. Missing security headers

- Severity: Medium
- Confidence: Confirmed
- Evidence:
  - `security_headers.py http://127.0.0.1:3005` reports missing HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP
- Impact:
  - weaker trust and technical hygiene
  - not a primary ranking factor by itself, but a quality and platform-hardening gap
- Fix:
  - add baseline headers in `next.config.ts`
  - leave CSP for a separate tighter pass if third-party scripts need inventorying

## Implemented Fixes

- `web/src/lib/seo.ts`
  - hardened canonical site URL resolution
  - added production-safe fallback to `https://bookgenerator.net`
  - ignores `localhost`, `.local`, and private-IP origins for canonical SEO output
- `web/src/app/sitemap.ts`
  - added example detail pages to sitemap
  - included tool routes from catalog data
  - replaced rolling timestamps with a stable default date
- `web/src/app/examples/page.tsx`
  - removed forced dynamic rendering
  - added `CollectionPage` + `ItemList` schema
- `web/src/app/examples/[slug]/page.tsx`
  - added `generateStaticParams`
  - removed forced dynamic rendering
  - added `Book` and `BreadcrumbList` schema
  - improved metadata descriptions and keyword coverage
- `web/src/app/robots.ts`
  - added explicit rules for search/AI crawlers
  - explicitly blocked training-style crawlers
  - added host and sitemap with production domain
- `web/src/app/llms.txt/route.ts`
  - added AI-readable summary route
  - upgraded to markdown link format for crawler readability
- `web/src/app/llms-full.txt/route.ts`
  - added extended AI-readable product and content map
  - upgraded to markdown link format
- `web/src/app/layout.tsx`
  - removed low-signal `SearchAction`
  - removed site-wide `speakable`
  - strengthened `Organization`, `WebSite`, and `SoftwareApplication` schema
- `web/next.config.ts`
  - added baseline security headers
- `web/src/lib/contact-shared.ts`
  - replaced `.local` support/billing fallbacks with public `.net` addresses
- `web/src/lib/marketing-data.ts`
  - aligned public support channel emails with real domain

## Verification Results

- `npm run build` succeeds
- `curl -sS http://127.0.0.1:3005/robots.txt`
  - host and sitemap now resolve to `https://bookgenerator.net`
- `curl -sS http://127.0.0.1:3005/sitemap.xml`
  - no `localhost` URLs remain
  - example pages such as `/examples/authority-in-100-pages` are present
- `curl -sS http://127.0.0.1:3005/llms.txt`
  - returns `200`
  - contains 23 markdown links to key pages, tools, and articles
- `llms_txt_checker.py http://127.0.0.1:3005`
  - quality score improved to `100/100`
- `robots_checker.py http://127.0.0.1:3005`
  - all major AI/search crawlers are now explicitly managed
- `curl -sS http://127.0.0.1:3005/examples/authority-in-100-pages`
  - canonical resolves to `https://bookgenerator.net/examples/authority-in-100-pages`
  - `Book` and `BreadcrumbList` structured data are present
- `security_headers.py http://127.0.0.1:3005`
  - confirms HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy

## Remaining Gaps

- `Content-Security-Policy` is still missing and should be added in a dedicated pass after auditing inline scripts and third-party dependencies.
- Next.js/Turbopack still emits an NFT tracing warning from `src/lib/examples-data.ts` via the example asset route. This is not blocking SEO output, but it should be cleaned up separately.
