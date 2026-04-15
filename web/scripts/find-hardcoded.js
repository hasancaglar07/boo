#!/usr/bin/env node
/**
 * find-hardcoded.js
 * Scans TSX/TSX components for hardcoded English strings not going through t()
 * Usage: node scripts/find-hardcoded.js [--dir=src/components] [--output=report.txt]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const scanDir = args.find(a => a.startsWith('--dir='))?.slice(6) || 'src/components';
const outputFile = args.find(a => a.startsWith('--output='))?.slice(9) || null;
const ROOT = path.resolve(__dirname, '..');

// Patterns that indicate hardcoded user-visible text in JSX
const SKIP_PATTERNS = [
  /^\s*$/,                          // empty/whitespace
  /^[{(].*[})]$/,                   // template expressions
  /^\d+(\.\d+)?%?$/,               // numbers / percentages
  /^https?:\/\//,                   // URLs
  /^\//,                            // paths
  /^[a-z][a-z0-9-_]*$/,            // single lowercase words (likely identifiers)
  /^\$\{/,                          // template literals
  /^className=/,                    // className props
  /^#[0-9a-fA-F]{3,8}$/,           // hex colors
  /^[a-z0-9._%+-]+@/,              // emails
  /^0\./,                           // decimal numbers
];

const SKIP_FILES = [
  'node_modules', '.next', 'dist', 'build', '__tests__', '.test.', '.spec.',
  'admin/', // skip admin components
];

const SKIP_COMPONENT_NAMES = [
  'cn(', 'clsx(', 'className', 'style=', 'href=', 'src=', 'alt=',
  'key=', 'id=', 'name=', 'type=', 'value=', 'data-', 'aria-',
];

function shouldSkipFile(filePath) {
  return SKIP_FILES.some(s => filePath.includes(s));
}

function shouldSkipString(str) {
  const trimmed = str.trim();
  if (trimmed.length < 2) return true;
  if (trimmed.length > 300) return true;  // too long, probably not a UI string
  return SKIP_PATTERNS.some(p => p.test(trimmed));
}

function isLikelyEnglish(str) {
  // Heuristic: contains common English words or looks like a sentence
  const words = str.trim().split(/\s+/);
  if (words.length === 1 && words[0].length < 3) return false;
  // Check if it has multiple words (likely a sentence/phrase)
  if (words.length >= 2) return true;
  // Single word but capitalized (like a button label)
  if (/^[A-Z][a-z]/.test(str.trim())) return true;
  return false;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results = [];

  // Check if file already uses translations
  const usesTranslations = content.includes('useTranslations') || content.includes('getTranslations');

  // Find JSX text content between tags: >Some Text<
  const jsxTextRegex = />([^<>{}\n]+)</g;
  // Find string literals in JSX props that look like UI text
  const propStringRegex = /(?:placeholder|title|label|aria-label|alt|tooltip|description|badge|heading|subtitle|text|message)=["']([^"']+)["']/g;
  // Find string arrays/objects with human text
  const stringLiteralRegex = /["']([A-Z][^"'\n]{3,80})["']/g;

  let match;
  const found = new Set();

  // JSX text nodes
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const str = match[1].trim();
    if (!shouldSkipString(str) && isLikelyEnglish(str) && !found.has(str)) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      found.add(str);
      results.push({ line: lineNum, type: 'jsx-text', text: str });
    }
  }

  // Prop strings
  while ((match = propStringRegex.exec(content)) !== null) {
    const str = match[1].trim();
    if (!shouldSkipString(str) && isLikelyEnglish(str) && !found.has(str)) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      found.add(str);
      results.push({ line: lineNum, type: 'prop', text: str });
    }
  }

  // String literals (capitalized, multi-word)
  while ((match = stringLiteralRegex.exec(content)) !== null) {
    const str = match[1].trim();
    if (!shouldSkipString(str) && isLikelyEnglish(str) && !found.has(str)) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      found.add(str);
      results.push({ line: lineNum, type: 'literal', text: str });
    }
  }

  return { filePath, usesTranslations, results };
}

function walkDir(dir) {
  const files = [];
  const fullDir = path.join(ROOT, dir);

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    for (const entry of fs.readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, entry);
      const relPath = path.relative(ROOT, fullPath);

      if (shouldSkipFile(relPath)) continue;

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(fullDir);
  return files;
}

// Main
const files = walkDir(scanDir);
const report = [];
let totalComponents = 0;
let totalWithHardcoded = 0;
let totalStrings = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const result = scanFile(file);
  totalComponents++;

  if (result.results.length > 0) {
    totalWithHardcoded++;
    totalStrings += result.results.length;
    report.push(result);
  }
}

// Sort by number of hardcoded strings (highest impact first)
report.sort((a, b) => b.results.length - a.results.length);

// Build output
const lines = [];
lines.push('='.repeat(80));
lines.push('HARDCODED STRINGS REPORT');
lines.push(`Scanned: ${scanDir}`);
lines.push(`Date: ${new Date().toISOString().split('T')[0]}`);
lines.push('='.repeat(80));
lines.push(`Total components scanned: ${totalComponents}`);
lines.push(`Components with hardcoded strings: ${totalWithHardcoded}`);
lines.push(`Total hardcoded strings found: ${totalStrings}`);
lines.push('');

// Priority groups
const alreadyI18n = files.filter(f => {
  const content = fs.readFileSync(f, 'utf-8');
  return content.includes('useTranslations') || content.includes('getTranslations');
});
lines.push(`Already using translations: ${alreadyI18n.length} files`);
lines.push('');
lines.push('─'.repeat(80));
lines.push('TOP PRIORITY COMPONENTS (most hardcoded strings):');
lines.push('─'.repeat(80));

for (const item of report.slice(0, 30)) {
  const rel = path.relative(ROOT, item.filePath);
  const status = item.usesTranslations ? '[partial t()]' : '[no i18n]';
  lines.push(`\n[${item.results.length} strings] ${rel} ${status}`);
  for (const r of item.results.slice(0, 8)) {
    lines.push(`  L${r.line}: "${r.text.slice(0, 80)}"`);
  }
  if (item.results.length > 8) {
    lines.push(`  ... and ${item.results.length - 8} more`);
  }
}

if (report.length > 30) {
  lines.push(`\n... and ${report.length - 30} more components with hardcoded strings`);
}

lines.push('');
lines.push('─'.repeat(80));
lines.push('ALL AFFECTED FILES (sorted by impact):');
lines.push('─'.repeat(80));
for (const item of report) {
  const rel = path.relative(ROOT, item.filePath).replace('src/', '');
  lines.push(`${item.results.length.toString().padStart(3)} strings  ${rel}`);
}

const output = lines.join('\n');

if (outputFile) {
  const outPath = path.join(ROOT, outputFile);
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`Report written to: ${outPath}`);
} else {
  console.log(output);
}
