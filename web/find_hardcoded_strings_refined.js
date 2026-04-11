const fs = require('fs');
const path = require('path');

// Manuel olarak kontrol ettiğimiz hardcoded stringler
const HARDCODED_STRINGS = [
  // Auth Form
  "Sign In",
  "Sign Up", 
  "Sending...",
  "Don't want to enter password • Send email link",
  "Processing",
  "Update Password",
  "Send Reset Link",
  "Back to login",
  "Re-enter your new password",
  "example@mail.com",
  "If an account exists with this email, a reset link will be sent. For security reasons, we may show the same message in some cases.",
  "Email",
  "Password",
  "Continue with Google",
  "Continue with Email",
  
  // Registration
  "Create Account",
  "Already have an account? Sign In",
  "First Name",
  "Last Name",
  "I want to prepare my first book quickly and in an organized way.",
  
  // Common UI Strings
  "Loading...",
  "Error",
  "Success",
  "Warning",
  "Info",
  "Continue",
  "Cancel",
  "Save",
  "Delete",
  "Edit",
  "Copy",
  "Share",
  "Download",
  "Upload",
  "Next",
  "Previous",
  "Submit",
  "Reset",
  "Try Again",
  "Retry",
  
  // Book Related
  "Book Title",
  "Chapter",
  "Table of Contents",
  "Preview",
  "Export",
  "Publish",
  "Draft",
  "Final",
  "Outline",
  "Style",
  "Topic",
  "Generate",
  
  // Admin/Dashboard
  "Dashboard",
  "Analytics",
  "Settings",
  "Profile",
  "Billing",
  "Books",
  "Users",
  "Reports",
  "Audit",
  "Jobs",
  
  // Common Messages
  "No results found",
  "Something went wrong",
  "Please try again",
  "Required",
  "Invalid email",
  "Password too short",
  "Passwords don't match",
  "Successfully saved",
  "Successfully deleted",
  "Successfully updated"
];

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
    HARDCODED_STRINGS.forEach(str => {
      const found = existingKeys.some(key => 
        enContent[key] === str || key.includes(str.toLowerCase())
      );
      if (!found) {
        missingStrings.push({
          string: str,
          suggestedKey: str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
        });
      }
    });
    
    console.log('🔍 JSON ile karşılaştırma tamamlandı');
    console.log(`Toplam hardcoded string: ${HARDCODED_STRINGS.length}`);
    console.log(`JSON'da olan: ${HARDCODED_STRINGS.length - missingStrings.length}`);
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
  console.log('🔍 Hardcoded string kontrol başlıyor...');
  
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