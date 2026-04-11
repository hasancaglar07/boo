const fs = require('fs');
const path = require('path');

// Tüm projede kontrol edilecek hardcoded stringler
const FINAL_STRINGS = [
  // Tüm projede kontrol edilecek temel stringler
  "Search",
  "Name",
  "No",
  "Yes",
  "Cancel",
  "Confirm",
  "Save",
  "Delete",
  "Edit",
  "View",
  "Settings",
  "Dashboard",
  "Users",
  "Books",
  "Analytics",
  "Export",
  "Import",
  "Filter",
  "Sort",
  "Clear",
  "Apply",
  "Reset",
  "Refresh",
  "Loading...",
  "Error",
  "Success",
  "Warning",
  "Info",
  "Page",
  "Results",
  "of",
  "Actions",
  "Select",
  "Deselect",
  "Select all",
  "Deselect all",
  "Active",
  "Inactive",
  "Pending",
  "Success",
  "Failed",
  "Processing",
  "Cancelled",
  "Completed",
  "Expired",
  "Draft",
  "Published",
  "Archived",
  "Deleted",
  
  // İleri seviye stringler
  "Total",
  "Average",
  "Growth",
  "Decline",
  "Trend",
  "Change",
  "Rate",
  "Percentage",
  "Amount",
  "Count",
  "Value",
  "Revenue",
  "Signups",
  "Users",
  "Books",
  "Churn",
  "Retention",
  "Conversion",
  
  // Tarihsel ve zamanlı stringler
  "From",
  "To",
  "Date range",
  "Last updated",
  "Created",
  "Updated",
  "Expired",
  "Started",
  "Ended",
  
  // User ve auth stringleri
  "Name",
  "Email",
  "Password",
  "Status",
  "Role",
  "Profile",
  "Account",
  "Login",
  "Logout",
  "Register",
  "Sign in",
  "Sign up",
  "Forgot password",
  "Reset password",
  "Remember me",
  "Don't have an account?",
  "Already have an account?",
  
  // Admin stringleri
  "Dashboard",
  "Users",
  "Revenue",
  "Analytics",
  "Settings",
  "Export",
  "Import",
  "Refresh",
  "Filter",
  "Sort",
  "Clear",
  "Apply",
  "Reset",
  "Loading...",
  "Error",
  "Success",
  "Warning",
  "Info",
  "Page",
  "Results",
  "of",
  "Actions",
  "Select",
  "Deselect",
  "Select all",
  "Deselect all",
  
  // Form ve input stringleri
  "Name",
  "Email",
  "Password",
  "Search",
  "Filter",
  "Sort",
  "Clear",
  "Apply",
  "Reset",
  "Save",
  "Cancel",
  "Submit",
  "Delete",
  "Edit",
  "View",
  "Settings",
  "Dashboard",
  "Users",
  "Books",
  "Analytics",
  "Export",
  "Import",
  "Refresh",
  "Loading...",
  "Error",
  "Success",
  "Warning",
  "Info",
  "Page",
  "Results",
  "of",
  "Actions",
  "Select",
  "Deselect",
  "Select all",
  "Deselect all",
  
  // Activity ve log stringleri
  "User created account",
  "User upgraded to premium",
  "Book generated",
  "Book exported",
  "Settings updated",
  "Password reset",
  "Login successful",
  "Logout successful",
  "Profile updated",
  "Email verified",
  "Payment processed",
  "Refund issued",
  "Subscription cancelled",
  "Plan changed",
  "Data exported",
  "Import completed",
  "View details",
  "Edit",
  "Delete",
  "Activate",
  "Deactivate",
  "Suspend",
  "Resume",
  "Reset",
  "Export",
  "Import",
  "Download",
  "Upload",
  "Search",
  "Filter",
  "Sort",
  "Refresh",
  "Clear",
  "Apply",
  "Cancel"
];

function findFinalHardcodedInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    // Daha gelişmiş regex patterns
    const patterns = [
      // Temel hardcoded stringler
      FINAL_STRINGS.map(s => `"${s}"`).join('|'),
      // Sadece büyük harfle başlayan 3+ kelimelik stringler
      /[A-Z][A-Za-z\s]{10,}/g,
      // Tek tırnak içindeki stringler
      /'[^']{10,}'/g,
      // Template literal içindeki stringler
      /`[^`]{10,}`/g
    ];
    
    patterns.forEach((pattern, patternIndex) => {
      const regex = new RegExp(pattern, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        let string = match[0];
        
        // Temizle
        if (string.startsWith('"') && string.endsWith('"')) {
          string = string.slice(1, -1);
        } else if (string.startsWith("'") && string.endsWith("'")) {
          string = string.slice(1, -1);
        } else if (string.startsWith("`") && string.endsWith("`")) {
          string = string.slice(1, -1);
        }
        
        // Uygun uzunlukta ise
        if (string.length > 5 && !string.includes('className') && !string.includes('className=')) {
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

function scanFinalFiles() {
  const sourceDir = path.join(__dirname, 'src');
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  function scan(currentPath) {
    const results = [];
    
    try {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          results.push(...scan(fullPath));
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          const matches = findFinalHardcodedInFile(fullPath);
          if (matches.length > 0) {
            results.push({
              file: fullPath,
              matches: matches
            });
          }
        }
      });
    } catch (error) {
      // console.log(`Dizin taranamadı: ${currentPath}`);
    }
    
    return results;
  }
  
  return scan(sourceDir);
}

function checkFinalAgainstJson(jsonFile, allFoundStrings) {
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
  console.log('🔍 Final project hardcoded string scanner başlatılıyor...');
  
  // Tüm dosyalarda hardcoded stringleri bul
  const allResults = scanFinalFiles();
  
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
  console.log(`Dosya sayısı hardcoded string içeriyor: ${allResults.length}`);
  
  // JSON'da olmayanları bul
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  const missingStrings = checkFinalAgainstJson(jsonFile, allFoundStrings);
  
  console.log(`JSON\'da olmayan hardcoded stringler: ${missingStrings.length}`);
  
  if (missingStrings.length > 0) {
    console.log('\n📋 Final hardcoded stringler:');
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
      console.log('\n✅ JSON dosyası final hardcoded stringlerle güncellendi!');
      
      // JSON dosyasının yeni boyutunu göster
      const stats = fs.statSync(jsonFile);
      console.log(`📊 JSON dosyası boyutu: ${stats.size} bytes`);
      
    } catch (error) {
      console.log('JSON güncelleme hatası:', error.message);
    }
  } else {
    console.log('\n✅ Tüm hardcoded stringler JSON\'da mevcut!');
  }
  
  // Detaylı hardcoded raporu
  console.log('\n📄 Detaylı hardcoded string taraması:');
  allResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.file}`);
    result.matches.forEach(match => {
      console.log(`   Satır ${match.line}: "${match.string}"`);
    });
  });
}

main();