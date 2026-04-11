const fs = require('fs');
const path = require('path');

// Daha gelişmiş hardcoded stringler
const ADVANCED_STRINGS = [
  // Önemli stringler
  "Ready to publish your book?",
  "Start Creating Today",
  
  // Common UI elements
  "Ready to publish your book?",
  "Start Creating Today",
  "Log In",
  "Register",
  "close",
  "remember me",
  "forgot password?",
  "don't have an account?",
  "already have an account?",
  "info",
  "edit",
  "copy",
  "next",
  "topic",
  
  // Components that might have hardcoded strings
  "Generate outline",
  "Apply style",
  "Create preview",
  "Export book",
  "Finalize",
  "Complete!",
  "Auto-save",
  "Save draft",
  "Save chapter",
  "Delete chapter",
  "Move up",
  "Move down",
  "Insert chapter",
  "Chapter comments",
  "Add comment",
  "Reply",
  "Resolve comment",
  "Unresolved comment",
  "Word count",
  "Character count",
  "Reading time",
  "Estimated completion",
  
  // Toolbar items
  "Bold",
  "Italic",
  "Underline",
  "Strikethrough",
  "Heading 1",
  "Heading 2",
  "Heading 3",
  "Paragraph",
  "Quote",
  "List",
  "Numbered list",
  "Link",
  "Image",
  "Table",
  "Code",
  
  // Admin and dashboard
  "Dashboard",
  "Settings",
  "Users",
  "Revenue",
  "Signups",
  "Paid",
  "Total revenue",
  "New users",
  "Active users",
  "Generated books",
  "Exported books",
  "Conversion rate",
  "Churn rate",
  "Referral rate",
  "Chart data not available",
  "Loading chart data...",
  "No data to display",
  "Processing",
  "Success",
  "Warning",
  "Draft",
  "Publish",
  
  // Writing interface
  "Chapter",
  "Table of Contents",
  "Preview",
  "Export",
  "Publish",
  "Draft",
  "Outline",
  "Style",
  "Topic",
  "Book Title",
  "Save",
  "Delete",
  "Edit",
  "Copy",
  "Download",
  
  // Common messages
  "Home",
  "Password",
  "Continue",
  "Loading...",
  "Sending...",
  "Last updated"
];

// Dosyalardaki daha karmaşık string tarama
function findAdvancedHardcodedInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    // Daha gelişmiş regex desenleri
    const advancedPatterns = [
      // Büyük harfle başlayan stringler
      /[A-Z][A-Za-z\s]{10,}/g,
      // Tek tırnak içindeki stringler
      /'[^']{10,}'/g,
      // Template literal içindeki stringler
      /`[^`]{10,}`/g,
      // HTML attributes içindeki stringler
      /value="[^"]{10,}"/g,
      // Placeholder'lar
      /placeholder="[^"]{10,}"/g,
      // aria-label'lar
      /aria-label="[^"]{10,}"/g,
      // title attributes
      /title="[^"]{10,}"/g,
      // className içindeki stringler
      /className="[^"]{10,}"/g
    ];
    
    advancedPatterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let string = match[0];
        
        // Temizle
        string = string.replace(/^(value|placeholder|aria-label|title|className)=["']/, '')
                       .replace(/["']$/, '');
        
        // Uygun uzunlukta ise
        if (string.length > 10 && !ADVANCED_STRINGS.includes(string)) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          matches.push({
            string: string,
            line: lineNumber,
            file: relativePath,
            pattern: patternIndex
          });
        }
      }
    });
    
    return matches;
  } catch (error) {
    return [];
  }
}

function scanForAdvancedStrings() {
  const sourceDir = path.join(__dirname, 'src');
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  function scan(currentPath) {
    const results = [];
    
    function scanDir(dirPath) {
      try {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            results.push(...scanDir(fullPath));
          } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
            const matches = findAdvancedHardcodedInFile(fullPath);
            if (matches.length > 0) {
              results.push({
                file: fullPath,
                matches: matches
              });
            }
          }
        });
      } catch (error) {
        // console.log(`Dizin taranamadı: ${dirPath}`);
      }
      
      return results;
    }
    
    return scanDir(currentPath);
  }
  
  return scan(sourceDir);
}

function checkAdvancedAgainstJson(jsonFile, allFoundStrings) {
  try {
    const enContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    const missingStrings = [];
    const existingStrings = [];
    
    // JSON'da mevcut olan stringleri topla
    function extractExistingStrings(obj, prefix = '') {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          existingStrings.push(obj[key]);
        } else if (obj[key] && typeof obj[key] === 'object') {
          extractExistingStrings(obj[key], prefix + key + '.');
        }
      }
    }
    extractExistingStrings(enContent);
    
    // Bulunan stringleri kontrol et
    const allMissing = [];
    allFoundStrings.forEach(str => {
      const found = existingStrings.some(existing => 
        existing === str || existing.toLowerCase().includes(str.toLowerCase()) || str.toLowerCase().includes(existing.toLowerCase())
      );
      
      if (!found) {
        allMissing.push({
          string: str,
          suggestedKey: str.toLowerCase().replace(/[^a-z0-9\s]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_')
        });
      }
    });
    
    // Tekil missing stringler
    const uniqueMissing = allMissing.filter((item, index, self) => 
      index === self.findIndex(t => t.string === item.string)
    );
    
    return uniqueMissing;
  } catch (error) {
    return allFoundStrings.map(str => ({
      string: str,
      suggestedKey: str.toLowerCase().replace(/[^a-z0-9\s]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_')
    }));
  }
}

function main() {
  console.log('🔍 Advanced hardcoded string scanner başlatılıyor...');
  
  // Tüm dosyalarda advanced hardcoded stringleri bul
  const allResults = scanForAdvancedStrings();
  
  // Bulunan tüm stringleri topla
  const allFoundStrings = [];
  allResults.forEach(result => {
    result.matches.forEach(match => {
      if (!allFoundStrings.includes(match.string)) {
        allFoundStrings.push(match.string);
      }
    });
  });
  
  console.log(`Toplam unique hardcoded string bulundu: ${allFoundStrings.length}`);
  
  // JSON'da olmayanları bul
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  const missingStrings = checkAdvancedAgainstJson(jsonFile, allFoundStrings);
  
  console.log(`JSON\'da olmayan hardcoded stringler: ${missingStrings.length}`);
  
  if (missingStrings.length > 0) {
    console.log('\n📋 Advanced hardcoded stringler:');
    missingStrings.forEach(({ string, suggestedKey }) => {
      console.log(`  "${string}" -> ${suggestedKey}`);
    });
    
    // JSON'a ekle
    const newStructure = {};
    missingStrings.forEach(({ string, suggestedKey }) => {
      newStructure[suggestedKey] = string;
    });
    
    console.log('\n✅ Eklenecek yeni JSON yapısı:');
    console.log(JSON.stringify(newStructure, null, 2));
    
    // JSON dosyasına ekle
    try {
      const enContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      
      // Mevcut yapıyı genişlet
      Object.assign(enContent, newStructure);
      
      // Güncellenmiş dosyayı kaydet
      fs.writeFileSync(jsonFile, JSON.stringify(enContent, null, 2));
      console.log('\n✅ JSON dosyası advanced hardcoded stringlerle güncellendi!');
    } catch (error) {
      console.log('JSON güncelleme hatası:', error.message);
    }
  } else {
    console.log('\n✅ Tüm hardcoded stringler JSON\'da mevcut!');
  }
}

main();