#!/usr/bin/env node
/**
 * translate-all.js – Node.js (no TypeScript deps) translation runner
 * Usage: node translate-all.js [--locales=tr,de,...] [--force] [--batch-size=40]
 */

const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://claudecode.codefast.app';
const API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98';
const SOURCE_FILE = path.resolve(__dirname, 'web/messages/en.json');
const MESSAGES_DIR = path.resolve(__dirname, 'web/messages');
const DEFAULT_LOCALES = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt'];
const MODEL = 'claude-sonnet-4-6';

// ── Arg parsing ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
let locales = DEFAULT_LOCALES;
let batchSize = 40;
let force = false;
let retries = 4;
let delayMs = 3000;
let localeDelayMs = 10000;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--locales=')) locales = a.slice('--locales='.length).split(',').map(s => s.trim()).filter(Boolean);
  else if (a.startsWith('--batch-size=')) batchSize = Math.max(1, Number(a.slice('--batch-size='.length)));
  else if (a.startsWith('--retries=')) retries = Math.max(0, Number(a.slice('--retries='.length)));
  else if (a.startsWith('--delay-ms=')) delayMs = Math.max(0, Number(a.slice('--delay-ms='.length)));
  else if (a.startsWith('--locale-delay-ms=')) localeDelayMs = Math.max(0, Number(a.slice('--locale-delay-ms='.length)));
  else if (a === '--force') force = true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function flatten(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const pk = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') result[pk] = v;
    else if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(result, flatten(v, pk));
  }
  return result;
}

function setDeep(target, dottedKey, value) {
  const parts = dottedKey.split('.');
  let cur = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function repairJsonQuotes(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '"') { out.push(text[i++]); continue; }
    out.push('"'); i++;
    while (i < text.length) {
      const c = text[i];
      if (c === '\\') { out.push(c); i++; if (i < text.length) { out.push(text[i]); i++; } continue; }
      if (c === '"') {
        let j = i + 1;
        while (j < text.length && ' \t\r\n'.includes(text[j])) j++;
        const next = text[j];
        if (!next || ':,}]'.includes(next)) { out.push(c); i++; break; }
        out.push('\\'); out.push(c); i++;
      } else if (c === '\n' || c === '\r') { out.push(c === '\n' ? '\\n' : '\\r'); i++; }
      else { out.push(c); i++; }
    }
  }
  return out.join('');
}

function extractJson(raw) {
  let candidate = raw.trim();
  if (!candidate.startsWith('{')) {
    const m = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (m?.[1]) candidate = m[1].trim();
    else {
      const a = candidate.indexOf('{'), b = candidate.lastIndexOf('}');
      if (a !== -1 && b !== -1 && b > a) candidate = candidate.slice(a, b + 1);
    }
  }
  try { JSON.parse(candidate); return candidate; } catch { /* try repair */ }
  const repaired = repairJsonQuotes(candidate);
  JSON.parse(repaired);
  return repaired;
}

// ── API call ─────────────────────────────────────────────────────────────────
async function postTranslation(payload) {
  const res = await fetch(`${API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      temperature: 0,
      system: 'You are a professional software localization engine. Return only valid JSON, no markdown and no extra prose. Preserve placeholders such as {count}, {name}, ICU syntax and HTML tags.',
      messages: [{ role: 'user', content: JSON.stringify(payload) }]
    })
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const retryable = res.status === 429 || res.status >= 500;
    const err = new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
    err.retryable = retryable;
    err.status = res.status;
    throw err;
  }

  const body = await res.json();
  const text = body.content?.find(p => p.type === 'text')?.text;
  if (!text) throw new Error('Unexpected API response shape');
  return text;
}

async function translateBatch(batchMap, targetLocale) {
  let attempt = 0, delay = delayMs;
  while (true) {
    attempt++;
    try {
      const payload = {
        task: 'translate_messages',
        sourceLocale: 'en',
        targetLocale,
        messages: batchMap,
        constraints: { keepPlaceholders: true, keepHtmlTags: true, keepIcuSyntax: true, keepUrls: true, keepEmails: true, preserveKeys: true, output: 'json_object_only' }
      };
      const raw = await postTranslation(payload);
      const jsonText = extractJson(raw);
      const parsed = JSON.parse(jsonText);
      const translated = parsed.messages ?? parsed.translated ?? parsed;

      const output = {};
      for (const key of Object.keys(batchMap)) {
        const val = translated[key];
        if (typeof val !== 'string' || !val.trim()) throw new Error(`Missing key: ${key}`);
        output[key] = val;
      }
      return output;
    } catch (err) {
      if (err.retryable === false) throw err;
      if (attempt > retries + 1) throw err;
      console.warn(`  [${targetLocale}] batch attempt ${attempt} failed: ${err.message}. Retry in ${delay}ms...`);
      await sleep(delay);
      delay = Math.min(delay * 2, 30000);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error('[translate] ANTHROPIC_API_KEY environment variable is not set.');
    process.exitCode = 1;
    return;
  }

  const sourceRaw = fs.readFileSync(SOURCE_FILE, 'utf8');
  const sourceJson = JSON.parse(sourceRaw);
  const sourceFlat = flatten(sourceJson);
  const sourceEntries = Object.entries(sourceFlat);

  console.log(`[translate] ${sourceEntries.length} keys loaded from en.json`);
  console.log(`[translate] Locales: ${locales.join(', ')}`);
  console.log(`[translate] Force: ${force}, Batch size: ${batchSize}\n`);

  for (const locale of locales) {
    if (locale === 'en') continue;

    console.log(`\n━━━ [${locale}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const localePath = path.join(MESSAGES_DIR, `${locale}.json`);
    let existingFlat = {};
    try {
      const existingRaw = fs.readFileSync(localePath, 'utf8');
      existingFlat = flatten(JSON.parse(existingRaw));
    } catch { existingFlat = {}; }

    // Detect if the file is still in English (values match source)
    let englishKeyCount = 0;
    for (const [k, v] of sourceEntries) {
      if (existingFlat[k] === v) englishKeyCount++;
    }
    const isStillEnglish = englishKeyCount > sourceEntries.length * 0.5;

    const missingEntries = (force || isStillEnglish)
      ? sourceEntries
      : sourceEntries.filter(([key]) => {
          const val = existingFlat[key];
          return typeof val !== 'string' || !val.trim();
        });

    if (missingEntries.length === 0) {
      console.log(`  ✓ Already complete, skipping.`);
      continue;
    }

    if (isStillEnglish && !force) {
      console.log(`  ⚠ File is still in English (${englishKeyCount}/${sourceEntries.length} keys match source) — forcing full retranslation.`);
    } else {
      console.log(`  ${missingEntries.length} keys to translate.`);
    }

    const chunks = chunk(missingEntries, batchSize);
    const flatOutput = { ...existingFlat };
    let successCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const batchMap = Object.fromEntries(chunks[i]);
      process.stdout.write(`  Batch ${i + 1}/${chunks.length} (${chunks[i].length} keys)... `);

      try {
        const translated = await translateBatch(batchMap, locale);
        Object.assign(flatOutput, translated);
        successCount += Object.keys(translated).length;
        console.log(`✓`);
      } catch (err) {
        console.log(`✗ ${err.message}`);
        // Keep going with next batch, save what we have
      }

      // Save progress after each batch
      const out = {};
      for (const [k, v] of Object.entries(flatOutput)) setDeep(out, k, v);
      fs.writeFileSync(localePath, JSON.stringify(out, null, 2) + '\n', 'utf8');

      if (delayMs > 0 && i < chunks.length - 1) await sleep(delayMs);
    }

    console.log(`  → ${locale}.json written. ${successCount} keys translated.`);

    // Pause between languages to avoid rate limiting
    const localeIndex = locales.indexOf(locale);
    if (localeIndex < locales.length - 1 && localeDelayMs > 0) {
      console.log(`  ⏳ Waiting ${localeDelayMs / 1000}s before next language...`);
      await sleep(localeDelayMs);
    }
  }

  console.log('\n[translate] All done.');
}

main().catch(err => {
  console.error('[translate] Fatal:', err);
  process.exitCode = 1;
});
