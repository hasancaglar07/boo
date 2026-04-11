import fs from 'node:fs/promises';
import path from 'node:path';

type JSONObject = Record<string, unknown>;

type CliOptions = {
  locales: string[];
  sourceLocale: string;
  batchSize: number;
  retries: number;
  delayMs: number;
  testMode: boolean;
  model: string;
  force: boolean;
};

class TranslationApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

const API_BASE_URL = 'https://claudecode.codefast.app';
const API_KEY = process.env.CODEFAST_TRANSLATE_API_KEY || 'sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98';
const SOURCE_FILE = path.resolve(process.cwd(), 'messages/en.json');
const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

const DEFAULT_LOCALES = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt'];

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    locales: DEFAULT_LOCALES,
    sourceLocale: 'en',
    batchSize: 80,
    retries: 4,
    delayMs: 900,
    testMode: false,
    model: 'claude-sonnet-4-6',
    force: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg.startsWith('--locales=')) {
      options.locales = arg.slice('--locales='.length).split(',').map((value) => value.trim()).filter(Boolean);
    } else if (arg === '--locales' && next) {
      options.locales = next.split(',').map((value) => value.trim()).filter(Boolean);
      i += 1;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = Math.max(1, Number(arg.slice('--batch-size='.length)));
    } else if (arg === '--batch-size' && next) {
      options.batchSize = Math.max(1, Number(next));
      i += 1;
    } else if (arg.startsWith('--retries=')) {
      options.retries = Math.max(0, Number(arg.slice('--retries='.length)));
    } else if (arg === '--retries' && next) {
      options.retries = Math.max(0, Number(next));
      i += 1;
    } else if (arg.startsWith('--delay-ms=')) {
      options.delayMs = Math.max(0, Number(arg.slice('--delay-ms='.length)));
    } else if (arg === '--delay-ms' && next) {
      options.delayMs = Math.max(0, Number(next));
      i += 1;
    } else if (arg.startsWith('--model=')) {
      options.model = arg.slice('--model='.length).trim();
    } else if (arg === '--model' && next) {
      options.model = next.trim();
      i += 1;
    } else if (arg === '--test') {
      options.testMode = true;
    } else if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

function isObject(value: unknown): value is JSONObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenObject(input: JSONObject, parent = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    const nextKey = parent ? `${parent}.${key}` : key;

    if (typeof value === 'string') {
      result[nextKey] = value;
    } else if (isObject(value)) {
      Object.assign(result, flattenObject(value, nextKey));
    }
  }

  return result;
}

function setDeepValue(target: JSONObject, dottedKey: string, value: string): void {
  const parts = dottedKey.split('.');
  let cursor: JSONObject = target;

  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!isObject(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part] as JSONObject;
  }

  cursor[parts[parts.length - 1]] = value;
}

function chunkEntries(entries: Array<[string, string]>, size: number): Array<Array<[string, string]>> {
  const chunks: Array<Array<[string, string]>> = [];

  for (let i = 0; i < entries.length; i += size) {
    chunks.push(entries.slice(i, i + size));
  }

  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error('Could not extract JSON object from translation response.');
}

async function postTranslationRequest(payload: JSONObject, model: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0,
      system:
        'You are a professional software localization engine. Return only valid JSON, no markdown and no extra prose. Preserve placeholders such as {count}, {name}, ICU syntax and HTML tags.',
      messages: [
        {
          role: 'user',
          content: JSON.stringify(payload)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    const retryable = response.status === 429 || response.status >= 500;
    throw new TranslationApiError(
      `Translation API request failed (${response.status}): ${errorText}`,
      response.status,
      retryable
    );
  }

  const body = (await response.json()) as {
    content?: Array<{type?: string; text?: string}>;
  };

  const text = body.content?.find((part) => part.type === 'text')?.text;
  if (!text) {
    throw new Error('Translation API returned an unexpected response shape (missing content[0].text).');
  }

  return text;
}

async function translateBatchWithRetry(
  batchMap: Record<string, string>,
  targetLocale: string,
  options: CliOptions
): Promise<Record<string, string>> {
  let attempt = 0;
  let delay = options.delayMs;

  while (true) {
    attempt += 1;

    try {
      const promptPayload = {
        task: 'translate_messages',
        sourceLocale: options.sourceLocale,
        targetLocale,
        messages: batchMap,
        constraints: {
          keepPlaceholders: true,
          keepHtmlTags: true,
          keepIcuSyntax: true,
          keepUrls: true,
          keepEmails: true,
          preserveKeys: true,
          output: 'json_object_only'
        }
      };

      const raw = await postTranslationRequest(promptPayload, options.model);
      const jsonText = extractJsonBlock(raw);
      const parsed = JSON.parse(jsonText) as {
        messages?: Record<string, string>;
        translated?: Record<string, string>;
      };

      const translated = parsed.messages ?? parsed.translated ?? (parsed as unknown as Record<string, string>);
      if (!isObject(translated)) {
        throw new Error('Translated payload is not an object.');
      }

      const output: Record<string, string> = {};
      for (const key of Object.keys(batchMap)) {
        const value = translated[key];
        if (typeof value !== 'string' || !value.trim()) {
          throw new Error(`Missing or invalid translation for key: ${key}`);
        }
        output[key] = value;
      }

      return output;
    } catch (error) {
      if (error instanceof TranslationApiError && !error.retryable) {
        throw error;
      }

      if (attempt > options.retries + 1) {
        throw error;
      }

      console.warn(
        `[translate] ${targetLocale} batch failed on attempt ${attempt}. Retrying in ${delay}ms...`,
        error
      );
      await sleep(delay);
      delay *= 2;
    }
  }
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!API_KEY) {
    throw new Error('Missing API key. Set CODEFAST_TRANSLATE_API_KEY or update scripts/translate.ts.');
  }

  const sourceRaw = await fs.readFile(SOURCE_FILE, 'utf8');
  const sourceJson = JSON.parse(sourceRaw) as JSONObject;
  const sourceFlat = flattenObject(sourceJson);
  const sourceEntries = Object.entries(sourceFlat);

  if (sourceEntries.length === 0) {
    throw new Error('messages/en.json does not contain translatable string entries.');
  }

  if (options.testMode) {
    const sample = Object.fromEntries(sourceEntries.slice(0, Math.min(3, sourceEntries.length)));
    const probe = await translateBatchWithRetry(sample, options.locales[0] || 'tr', options);
    console.log('[translate:test] Probe successful. Sample keys:', Object.keys(probe));
    return;
  }

  console.log(`[translate] Loaded ${sourceEntries.length} message keys from en.json`);

  for (const locale of options.locales) {
    if (locale === options.sourceLocale) continue;

    console.log(`[translate] Translating locale: ${locale}`);

    const localePath = path.join(MESSAGES_DIR, `${locale}.json`);

    let existingFlat: Record<string, string> = {};
    try {
      const existingRaw = await fs.readFile(localePath, 'utf8');
      const existingJson = JSON.parse(existingRaw) as JSONObject;
      existingFlat = flattenObject(existingJson);
    } catch {
      existingFlat = {};
    }

    const missingEntries = options.force
      ? sourceEntries
      : sourceEntries.filter(([key]) => {
          const value = existingFlat[key];
          return typeof value !== 'string' || !value.trim();
        });

    if (missingEntries.length === 0) {
      console.log(`[translate] ${locale} already complete, skipping.`);
      continue;
    }

    if (options.force) {
      console.log(`[translate] ${locale} force mode: retranslating all ${missingEntries.length} keys.`);
    } else {
      console.log(
        `[translate] ${locale} has ${missingEntries.length} missing keys (existing: ${sourceEntries.length - missingEntries.length}).`
      );
    }

    const chunks = chunkEntries(missingEntries, options.batchSize);
    const flatOutput: Record<string, string> = {...existingFlat};

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const batchObject = Object.fromEntries(chunk);

      const translatedChunk = await translateBatchWithRetry(batchObject, locale, options);
      Object.assign(flatOutput, translatedChunk);

      console.log(
        `[translate] ${locale} batch ${index + 1}/${chunks.length} complete (${Object.keys(translatedChunk).length} keys)`
      );

      // Save progress after each batch so we can resume on failure
      const partialObject: JSONObject = {};
      for (const [key, value] of Object.entries(flatOutput)) {
        setDeepValue(partialObject, key, value);
      }
      await fs.writeFile(localePath, `${JSON.stringify(partialObject, null, 2)}\n`, 'utf8');

      if (options.delayMs > 0 && index < chunks.length - 1) {
        await sleep(options.delayMs);
      }
    }

    console.log(`[translate] Wrote ${localePath}`);
  }

  console.log('[translate] Completed all locales.');
}

run().catch((error) => {
  console.error('[translate] Failed:', error);
  process.exitCode = 1;
});
