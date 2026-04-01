# Codefast Integration

This project now uses a shared-key Codefast orchestration layer.

## Primary Environment

Create `.env.codefast.local` from `.env.codefast.example` and set:

```bash
CODEFAST_API_KEY=sk-your-api-key
codefast=sk-your-api-key
```

`book-generator-env.sh` loads this file automatically.

## Text Fallback Chain

Default order for most book-writing tasks:

1. `https://claudecode.codefast.app` -> `claude-sonnet-4-6` (`~600/day`)
2. `https://codex.codefast.app/v1` -> `gpt-5.4` (`1000/day`)
3. `https://api14.codefast.app` -> `gemini-3.1-pro` (`750/day`)
4. `https://claudecode2.codefast.app` -> `GLM-5.1` (`1000/day`)
5. `https://api11.codefast.app/v1` -> `Qwen3.5` / `Qwen3.5-Coder` (`1000/day`)
6. `https://api12.codefast.app/v1` -> `grok-4.20-beta` (`600/day`)
7. Local Ollama fallback

The scripts track local daily usage per provider. If a provider returns quota, credit,
or rate-limit errors, it is marked exhausted for the rest of the day and the next
provider is used automatically.

## Cover / Image Fallback Chain

The cover script now uses direct Codefast media APIs:

1. `grokapi.codefast.app` -> Grok Imagine (`100/day`)
2. `geminiapi.codefast.app` -> Nano Banana Pro (`300/day` shared studio pool)
3. `geminiapi.codefast.app` -> Nano Banana 2 (`300/day` shared studio pool)

Static book covers intentionally skip `Veo 3.1` because it is video-focused.

## Dashboard

The dashboard now supports `CODEFAST_API_KEY` directly. The same key powers:

- outline generation
- chapter generation/rewrite/review
- appendices and references
- AI cover generation

Legacy key fields remain available, but the recommended path is a single
`CODEFAST_API_KEY`.
