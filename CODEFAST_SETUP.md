# Codefast Integration

This project now uses a shared-key Codefast orchestration layer.

## Primary Environment

Create `.env.codefast.local` from `.env.codefast.example` and set:

```bash
CODEFAST_API_KEY=sk-your-api-key
codefast=sk-your-api-key
```

`book-generator-env.sh` loads this file automatically.

## Text Provider

All text-generation flows are configured to use:

- `https://claudecode2.codefast.app`
- Model: `GLM-5.1`

There is no multi-model text fallback chain in the active setup.

## Local Quota Gate

Local daily quota/exhausted tracking is disabled by default.

- Default: `CODEFAST_ENABLE_LOCAL_LIMIT_TRACKING=0` (or unset)
- Optional: set `CODEFAST_ENABLE_LOCAL_LIMIT_TRACKING=1` only if you explicitly want local quota gating.

Upstream 429/rate-limit responses are still detected and logged, but they do not
automatically block GLM with a local daily marker when tracking is disabled.

## Cover / Image Fallback Chain

The cover script now uses direct Codefast media APIs:

1. `grokapi.codefast.app` -> Grok Imagine
2. `geminiapi.codefast.app` -> Nano Banana Pro
3. `geminiapi.codefast.app` -> Nano Banana 2

Static book covers intentionally skip `Veo 3.1` because it is video-focused.

## Dashboard

The dashboard now supports `CODEFAST_API_KEY` directly. The same key powers:

- outline generation
- chapter generation/rewrite/review
- appendices and references
- AI cover generation

Legacy key fields remain available, but the recommended path is a single
`CODEFAST_API_KEY`.
