const fs = require('fs');
const path = require('path');

// Admin ve dashboard dosyalarında kontrol edilecek hardcoded stringler
const ADMIN_STRINGS = [
  // Admin dashboard
  "New users vs premium conversions",
  "Weekly signup and paid flow", 
  "User growth",
  "New user trend",
  "Revenue",
  "Signups",
  "Paid",
  "Users",
  "vs previous period",
  
  // Admin charts
  "Chart data not available",
  "Loading chart data...",
  "No data to display",
  
  // Admin activity
  "User created account",
  "User upgraded to premium",
  "Book generated",
  "Book exported",
  "Settings updated",
  "Password reset",
  "Login successful",
  "Logout successful",
  
  // Admin metrics
  "Total revenue",
  "New users",
  "Active users",
  "Generated books",
  "Exported books",
  "Conversion rate",
  "Churn rate",
  "Referral rate"
];

// Book related strings
const BOOK_STRINGS = [
  "Book generated successfully",
  "Book exported successfully",
  "Chapter created",
  "Chapter updated",
  "Outline generated",
  "Style applied",
  "Book preview ready",
  "Book published",
  "Book draft saved",
  "Book finalized",
  
  // Error messages
  "Book generation failed",
  "Export failed",
  "Save failed",
  "Network error",
  "Server error",
  "Invalid input",
  "File too large",
  "Format not supported",
  
  // Progress
  "Generating outline...",
  "Writing chapters...",
  "Applying style...",
  "Creating preview...",
  "Exporting book...",
  "Finalizing...",
  "Complete!"
];

// Writing interface
const WRITING_STRINGS = [
  "Chapter",
  "Table of Contents",
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
  
  // Toolbar
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
  "Code"
];

// Common UI strings
const UI_STRINGS = [
  "Close",
  "Open",
  "Menu",
  "Back",
  "Forward",
  "Refresh",
  "Search",
  "Filter",
  "Sort",
  "Export",
  "Import",
  "Clear",
  "Select all",
  "Deselect all",
  "Copy",
  "Paste",
  "Cut",
  "Undo",
  "Redo",
  "Zoom in",
  "Zoom out",
  "Reset zoom",
  "Fullscreen",
  "Exit fullscreen"
];

// Newsletter and contact
const CONTACT_STRINGS = [
  "Subscribe to our newsletter",
  "Enter your email",
  "Subscribe",
  "Unsubscribe",
  "Email address",
  "Invalid email address",
  "Already subscribed",
  "Subscribed successfully",
  "Unsubscribed successfully",
  "Contact form",
  "Your name",
  "Your message",
  "Send message",
  "Message sent successfully",
  "Failed to send message"
];

// All hardcoded strings to check
const ALL_STRINGS = [...ADMIN_STRINGS, ...BOOK_STRINGS, ...WRITING_STRINGS, ...UI_STRINGS, ...CONTACT_STRINGS];

function checkAndReportMissingStrings() {
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  try {
    const enContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    // Mevcut JSON anahtarlarını topla
    const existingKeys = [];
    function extractKeys(obj, prefix = '') {
      for (let key in obj) {
        if (typeof obj[key] === 'string') {
          existingKeys.push(prefix + key);
        } else if (obj[key] && typeof obj[key] === 'object') {
          extractKeys(obj[key], prefix + key + '.');
        }
      }
    }
    extractKeys(enContent);
    
    // JSON'da olmayan hardcoded stringleri bul
    const missingStrings = [];
    ALL_STRINGS.forEach(str => {
      const found = existingKeys.some(key => 
        enContent[key] === str || key.includes(str.toLowerCase())
      );
      if (!found) {
        missingStrings.push({
          string: str,
          suggestedKey: str.toLowerCase().replace(/[^a-z0-9\s]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_')
        });
      }
    });
    
    console.log('🔍 Admin ve diğer hardcoded string kontrolü tamamlandı');
    console.log(`Toplam hardcoded string: ${ALL_STRINGS.length}`);
    console.log(`JSON'da olan: ${ALL_STRINGS.length - missingStrings.length}`);
    console.log(`JSON'da olmayan: ${missingStrings.length}`);
    
    if (missingStrings.length > 0) {
      console.log('\n❌ JSON\'da olmayan hardcoded stringler:');
      missingStrings.forEach(({ string, suggestedKey }) => {
        console.log(`  "${string}" -> ${suggestedKey}`);
      });
    }
    
    return missingStrings;
  } catch (error) {
    console.log('JSON dosyası okunamadı:', error.message);
    return [];
  }
}

function generateJsonStructure(missingStrings) {
  const structure = {};
  
  missingStrings.forEach(({ string, suggestedKey }) => {
    structure[suggestedKey] = string;
  });
  
  return structure;
}

// Ana fonksiyon
function main() {
  console.log('🔍 Admin ve diğer hardcoded string kontrol başlıyor...');
  
  const missingStrings = checkAndReportMissingStrings();
  
  if (missingStrings.length > 0) {
    console.log('\n📋 JSON yapısı oluşturuluyor...');
    const newStructure = generateJsonStructure(missingStrings);
    
    console.log('\n✅ Önerilen yeni JSON yapısı:');
    console.log(JSON.stringify(newStructure, null, 2));
    
    // Bu JSON yapısını mevcut dosyaya ekleme
    const jsonFile = path.join(__dirname, 'messages', 'en.json');
    try {
      const enContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      
      // Mevcut yapıyı genişlet
      Object.assign(enContent, newStructure);
      
      // Güncellenmiş dosyayı kaydet
      fs.writeFileSync(jsonFile, JSON.stringify(enContent, null, 2));
      console.log('\n✅ JSON dosyası güncellendi!');
    } catch (error) {
      console.log('JSON güncelleme hatası:', error.message);
    }
  } else {
    console.log('\n✅ Tüm hardcoded stringler JSON\'da mevcut!');
  }
}

main();