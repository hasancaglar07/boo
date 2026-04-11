const fs = require('fs');
const path = require('path');

// Admin componentlerde hardcoded stringler
const ADMIN_STRINGS = [
  // Admin overview
  "Revenue",
  "Signups", 
  "Paid",
  "Users",
  "vs previous period",
  "Chart data not available",
  "Loading chart data...",
  "No data to display",
  
  // Status badges
  "Active",
  "Success",
  "Pending",
  "Failed",
  "Cancelled",
  "Completed",
  "Processing",
  "Cancelled",
  "Failed",
  "Success",
  "Active",
  "Inactive",
  "Suspended",
  "Pending",
  "Approved",
  "Rejected",
  "Expired",
  "Draft",
  "Published",
  "Archived",
  "Deleted",
  "Error",
  "Warning",
  "Info",
  "Success",
  
  // Admin navigation
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
  "Search",
  
  // Metric cards
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
  
  // Activity feed
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
  
  // Admin actions
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
  "Cancel",
  
  // Admin forms
  "Name",
  "Email",
  "Status",
  "Role",
  "Date range",
  "From",
  "To",
  "Search",
  "Filter",
  "Sort by",
  "Order",
  "Apply filters",
  "Reset filters",
  "Save",
  "Cancel",
  "Delete",
  "Confirm",
  "Yes",
  "No",
  
  // Admin tables
  "ID",
  "Name",
  "Email",
  "Status",
  "Created",
  "Updated",
  "Actions",
  "Select",
  "Deselect",
  "Select all",
  "Deselect all",
  "Page",
  "of",
  "Results",
  "No results found",
  "Loading...",
  "Error loading data",
  
  // Admin charts
  "Chart",
  "Graph",
  "Trend",
  "Analysis",
  "Overview",
  "Statistics",
  "Metrics",
  "Performance",
  "Growth",
  "Revenue",
  "Users",
  "Books",
  "Revenue",
  "Signups",
  "Paid",
  "Users",
  "Conversion",
  "Retention",
  "Churn",
  "Referral"
];

function findAdminHardcodedInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    const regex = new RegExp(`("${ADMIN_STRINGS.join('|')}")`, 'g');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const string = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      matches.push({
        string: string,
        line: lineNumber,
        file: relativePath
      });
    }
    
    return matches;
  } catch (error) {
    return [];
  }
}

function scanAdminFiles() {
  const adminDir = path.join(__dirname, 'src', 'components', 'admin');
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  function scan(currentPath) {
    const results = [];
    
    try {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          results.push(...scan(fullPath));
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          const matches = findAdminHardcodedInFile(fullPath);
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
    
    return results;
  }
  
  return scan(adminDir);
}

function checkAdminAgainstJson(jsonFile, stringsToCheck) {
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
    
    // JSON'da olmayan hardcoded stringleri bul
    stringsToCheck.forEach(str => {
      const found = existingStrings.some(existing => 
        existing === str || existing.toLowerCase().includes(str.toLowerCase()) || str.toLowerCase().includes(existing.toLowerCase())
      );
      
      if (!found) {
        missingStrings.push({
          string: str,
          suggestedKey: str.toLowerCase().replace(/[^a-z0-9\s]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_')
        });
      }
    });
    
    return missingStrings;
  } catch (error) {
    return stringsToCheck.map(str => ({
      string: str,
      suggestedKey: str.toLowerCase().replace(/[^a-z0-9\s]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_')
    }));
  }
}

function main() {
  console.log('🔍 Admin hardcoded string scanner başlatılıyor...');
  
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  // Admin dosyalarında hardcoded stringleri bul
  const adminResults = scanAdminFiles();
  
  console.log(`Admin dosyaları tarama tamamlandı: ${adminResults.length} dosya hardcoded string içeriyor`);
  
  // JSON'da olmayanları bul
  const missingStrings = checkAdminAgainstJson(jsonFile, ADMIN_STRINGS);
  
  console.log(`Toplam hardcoded string: ${ADMIN_STRINGS.length}`);
  console.log(`JSON\'da olan: ${ADMIN_STRINGS.length - missingStrings.length}`);
  console.log(`JSON\'da olmayan: ${missingStrings.length}`);
  
  // JSON'a eksik stringleri ekle
  if (missingStrings.length > 0) {
    console.log('\n📋 Admin hardcoded stringler:');
    missingStrings.forEach(({ string, suggestedKey }) => {
      console.log(`  "${string}" -> ${suggestedKey}`);
    });
    
    const newStructure = {};
    missingStrings.forEach(({ string, suggestedKey }) => {
      newStructure[suggestedKey] = string;
    });
    
    console.log('\n✅ Eklenecek yeni JSON yapısı:');
    console.log(JSON.stringify(newStructure, null, 2));
    
    try {
      const enContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      
      // Mevcut yapıyı genişlet
      Object.assign(enContent, newStructure);
      
      // Güncellenmiş dosyayı kaydet
      fs.writeFileSync(jsonFile, JSON.stringify(enContent, null, 2));
      console.log('\n✅ JSON dosyası admin hardcoded stringlerle güncellendi!');
      
      console.log('\n📊 Tarama detayları:');
      adminResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.file}`);
        result.matches.forEach(match => {
          console.log(`   Satır ${match.line}: "${match.string}"`);
        });
      });
      
    } catch (error) {
      console.log('JSON güncelleme hatası:', error.message);
    }
  } else {
    console.log('\n✅ Tüm admin hardcoded stringler JSON\'da mevcut!');
  }
}

main();