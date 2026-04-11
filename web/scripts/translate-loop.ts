import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = path.resolve(__dirname, '..');

const MAX_RUNS = 300;
const DELAY_MS = 20_000;

function runTranslate(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['tsx', './scripts/translate.ts'], {
      cwd: CWD,
      stdio: 'inherit',
      shell: true
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  for (let run = 1; run <= MAX_RUNS; run++) {
    console.log(`\n[translate-loop] ─── Run #${run} / ${MAX_RUNS} ───`);
    const code = await runTranslate();

    if (code === 0) {
      console.log('[translate-loop] All locales complete!');
      process.exit(0);
    }

    if (run < MAX_RUNS) {
      console.log(`[translate-loop] Incomplete (exit ${code}) — retrying in ${DELAY_MS / 1000}s…`);
      await sleep(DELAY_MS);
    }
  }

  console.error('[translate-loop] Max runs reached without completion.');
  process.exit(1);
}

main();
