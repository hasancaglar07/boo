const fs = require('fs');
const filePath = 'C:/Users/ihsan/Desktop/BOOK/web/src/lib/marketing-data.ts';
const content = fs.readFileSync(filePath, 'utf8');

const startNeedle = 'slug: "ilk-kitabimi-nasil-planlarim",';
const endNeedle = 'slug: "epub-ve-pdf-farki",';
const startIdx = content.indexOf(startNeedle);
const endIdx = content.indexOf(endNeedle, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers!', { startIdx, endIdx });
  process.exit(1);
}

console.log('Start:', startIdx, 'End:', endIdx);

// Find the beginning of the line (the "  {" before the slug)
let blockStart = startIdx;
while (blockStart > 0 && content[blockStart] !== '{') {
  blockStart--;
}

// We want to include the "  {" and the newline after "},"
let blockEnd = endIdx;
while (blockEnd > 0 && content[blockEnd] !== '{') {
  blockEnd--;
}

// Go back to include "  },\n  {"
// Find the closing brace before endIdx
let closingBrace = blockEnd - 1;
while (closingBrace > startIdx && (content[closingBrace] === ' ' || content[closingBrace] === '\n' || content[closingBrace] === '\r' || content[closingBrace] === ',' || content[closingBrace] === '}')) {
  closingBrace--;
}

console.log('Block start:', blockStart);
console.log('Before block char:', JSON.stringify(content.substring(blockStart - 5, blockStart + 5)));
console.log('Block end region:', JSON.stringify(content.substring(endIdx - 30, endIdx + 30)));

const oldBlock = content.substring(blockStart, endIdx);
console.log('Old block starts with:', oldBlock.substring(0, 80));
console.log('Old block ends with:', oldBlock.substring(oldBlock.length - 80));
