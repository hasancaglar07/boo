const fs = require('fs');
const path = require('path');

// Hardcoded string tespiti için regex desenleri
const STRING_PATTERNS = [
  // String literals (")
  /"[^"]{10,}"/g,
  // Template literals (`)
  /`[^`]{10,}`/g,
  // Single quotes (')
  /'[^']{10,}'/g,
  // Common hardcoded patterns
  /"[A-Z][A-Z\s]{5,}"/g,
  /"[a-z][a-z\s]{5,}"/g,
  /"[0-9][0-9\s]{3,}"/g
];

// JSON metinlerini hariç tutmak için
const IGNORE_PATTERNS = [
  /"use client"/,
  /"use server"/,
  /"defaultTitle"/,
  /"defaultDescription"/,
  /"next-intl"/,
  /"className="[^"]*"/,
  /"style="[^"]*"/,
  /"id="[^"]*"/,
  /"data-\w+="[^"]*"/
];

function findHardcodedStrings(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    STRING_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const stringContent = match[0];
        
        // Hariç tutulması gereken desenleri kontrol et
        let shouldIgnore = false;
        for (const ignorePattern of IGNORE_PATTERNS) {
          if (ignorePattern.test(stringContent)) {
            shouldIgnore = true;
            break;
          }
        }
        
        if (!shouldIgnore && stringContent.length > 10) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          matches.push({
            string: stringContent,
            line: lineNumber,
            file: relativePath
          });
        }
      }
    });
    
    return matches;
  } catch (error) {
    console.log(`Dosya okunamadı: ${filePath}`);
    return [];
  }
}

function scanDirectory(dirPath) {
  const results = [];
  
  function scan(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          const matches = findHardcodedStrings(fullPath);
          if (matches.length > 0) {
            results.push({
              file: fullPath,
              matches: matches
            });
          }
        }
      });
    } catch (error) {
      console.log(`Dizin taranamadı: ${currentPath}`);
    }
  }
  
  scan(dirPath);
  return results;
}

// Ana anahtar dosyasını kontrol et
function checkAgainstJson(filePath) {
  try {
    const enContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const strings = [];
    
    function extractKeys(obj, prefix = '') {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          strings.push(prefix + key);
        } else if (obj[key] && typeof obj[key] === 'object') {
          extractKeys(obj[key], prefix + key + '.');
        }
      }
    }
    
    extractKeys(enContent);
    return strings;
  } catch (error) {
    console.log('JSON dosyası okunamadı:', error.message);
    return [];
  }
}

// Çalıştırma
const sourceDir = path.join(__dirname, 'src');
const jsonFile = path.join(__dirname, 'messages', 'en.json');

console.log('🔍 Hardcoded string taranıyor...');
const hardcodedResults = scanDirectory(sourceDir);
const jsonKeys = checkAgainstJson(jsonFile);

console.log('\n📊 Sonuçlar:');
console.log(`Toplam hardcoded string bulundu: ${hardcodedResults.length}`);
console.log(`Toplam JSON anahtarı: ${jsonKeys.length}`);

// En çok bulunan hardcoded stringler
const stringCount = {};
hardcodedResults.forEach(result => {
  result.matches.forEach(match => {
    const cleanString = match.string.replace(/['"`]/g, '').trim();
    if (cleanString.length > 10) {
      stringCount[cleanString] = (stringCount[cleanString] || 0) + 1;
    }
  });
});

const sortedStrings = Object.entries(stringCount)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

console.log('\n🔥 En çok geçen hardcoded stringler:');
sortedStrings.forEach(([string, count]) => {
  console.log(`${count}: "${string}"`);
});

// JSON ile karşılaştırma
console.log('\n📋 JSON karşılaştırma:');
console.log(`JSON'da olmayan hardcoded string: ${hardcodedResults.length}`);
console.log(`JSON'da olan hardcoded string: ${jsonKeys.length}`);

// Detaylı rapor
console.log('\n📄 Detaylı rapor:');
hardcodedResults.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.file}`);
  result.matches.forEach(match => {
    console.log(`   Satır ${match.line}: ${match.string}`);
  });
});