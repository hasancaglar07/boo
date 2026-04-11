const fs = require('fs');
const path = require('path');

// API ve servis dosyalarında hardcoded stringler
const API_STRINGS = [
  // Auth API messages
  "Invalid credentials",
  "Email already in use",
  "Email not found",
  "Account not activated",
  "Token expired",
  "Invalid token",
  "Password reset successful",
  "Account created successfully",
  "Login successful",
  "Logout successful",
  "Session expired",
  "Invalid session",
  
  // Book API messages
  "Book not found",
  "Book created successfully",
  "Book updated successfully", 
  "Book deleted successfully",
  "Book exported successfully",
  "Invalid book data",
  "Chapter limit exceeded",
  "File too large",
  "Invalid file format",
  "Export format not supported",
  
  // User API messages
  "User not found",
  "User updated successfully",
  "User deleted successfully",
  "Invalid user data",
  "Permission denied",
  "Account suspended",
  "Account deleted",
  "Password changed successfully",
  "Email updated successfully",
  "Profile updated successfully",
  
  // Admin API messages
  "Admin access required",
  "Invalid admin permissions",
  "System maintenance",
  "Rate limit exceeded",
  "API key invalid",
  "API key expired",
  "Quota exceeded",
  "Service unavailable",
  "Database error",
  "Server error",
  
  // Validation messages
  "Field is required",
  "Field must be a valid email",
  "Field must be at least 8 characters",
  "Field must be less than 255 characters",
  "Field must be a number",
  "Field must be positive",
  "Field must be a date",
  "Invalid date format",
  "Field must be unique",
  "Field pattern mismatch",
  
  // File upload messages
  "File uploaded successfully",
  "File deleted successfully",
  "File not found",
  "File permission denied",
  "File corrupted",
  "File processing failed",
  "File validation failed",
  "File size exceeded",
  "File type not allowed",
  "File storage full",
  
  // Payment API messages
  "Payment successful",
  "Payment failed",
  "Payment cancelled",
  "Payment pending",
  "Payment expired",
  "Invalid payment method",
  "Payment method not supported",
  "Refund processed successfully",
  "Refund failed",
  "Subscription cancelled",
  "Subscription renewed",
  
  // Email messages
  "Email sent successfully",
  "Email delivery failed",
  "Invalid email address",
  "Email template not found",
  "Email queue full",
  "Email server error",
  "Email rate limit exceeded",
  "Email authentication failed",
  "Email connection failed",
  "Email configuration error",
  
  // Analytics messages
  "Analytics data not available",
  "Analytics date range invalid",
  "Analytics query failed",
  "Analytics cache error",
  "Analytics database error",
  "Analytics processing timeout",
  "Analytics data corrupted",
  "Analytics export failed",
  "Analytics report generated",
  "Analytics statistics calculated"
];

// Common error messages
const ERROR_MESSAGES = [
  "Something went wrong",
  "An unexpected error occurred",
  "Service temporarily unavailable",
  "Maintenance in progress",
  "Try again later",
  "Contact support",
  "Error processing request",
  "Invalid request parameters",
  "Resource not found",
  "Access denied",
  "Authentication required",
  "Permission denied",
  "Session expired",
  "Invalid session",
  "Network error",
  "Server error",
  "Database error",
  "Cache error",
  "File system error",
  "Configuration error"
];

// Success messages
const SUCCESS_MESSAGES = [
  "Operation completed successfully",
  "Data saved successfully",
  "Changes applied successfully",
  "Settings updated successfully",
  "Profile updated successfully",
  "Password changed successfully",
  "Email sent successfully",
  "File uploaded successfully",
  "Export completed successfully",
  "Generation completed successfully",
  "Download started",
  "Process completed",
  "Task completed successfully",
  "Action completed successfully",
  "Request processed successfully"
];

// Warning messages
const WARNING_MESSAGES = [
  "Action cannot be undone",
  "Data will be permanently deleted",
  "This action may take some time",
  "Large file detected",
  "Processing may take longer",
  "Slow network detected",
  "Browser not optimized",
  "Feature may not work properly",
  "Compatibility issues detected",
  "Deprecated feature detected"
];

// Info messages
const INFO_MESSAGES = [
  "Welcome to the platform",
  "Getting started guide",
  "Documentation available",
  "Help center",
  "Contact support",
  "Report a bug",
  "Request a feature",
  "System status",
  "Last updated",
  "Version",
  "Beta feature",
  "New feature available",
  "Hotfix deployed",
  "Maintenance scheduled"
];

// All strings to check
const ALL_STRINGS = [...API_STRINGS, ...ERROR_MESSAGES, ...SUCCESS_MESSAGES, ...WARNING_MESSAGES, ...INFO_MESSAGES];

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
    
    console.log('🔍 API ve servis hardcoded string kontrolü tamamlandı');
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
  console.log('🔍 API ve servis hardcoded string kontrol başlıyor...');
  
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