const fs = require('fs');
const path = require('path');

// Tüm dosyalarda kontrol edilecek hardcoded stringler
const HARDCODED_STRINGS = [
  // Header & Navigation
  "Sign In",
  "Sign Up",
  "Log In", 
  "Login",
  "Register",
  "Dashboard",
  "Home",
  "Profile",
  "Settings",
  "Logout",
  "Menu",
  "Close",
  "Back",
  "Search",
  "Filter",
  
  // Authentication
  "Email",
  "Password",
  "Remember me",
  "Forgot password?",
  "Don't have an account?",
  "Already have an account?",
  "Continue with Google",
  "Continue with Email",
  "Create Account",
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
  "First Name",
  "Last Name",
  "I want to prepare my first book quickly and in an organized way.",
  
  // Common UI
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
  "Ready to publish your book?",
  "Start Creating Today",
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
  
  // Admin/Dashboard
  "New users vs premium conversions",
  "Weekly signup and paid flow",
  "User growth",
  "New user trend",
  "Revenue",
  "Signups",
  "Paid",
  "Users",
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
  "New users vs premium conversions",
  "Weekly signup and paid flow",
  "User growth",
  "New user trend",
  
  // Writing Interface
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
  "Code",
  
  // Newsletter and Contact
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
  "Failed to send message",
  
  // API Messages
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
  "Book not found",
  "Book created successfully",
  "Book updated successfully",
  "Book deleted successfully",
  "Book exported successfully",
  "Invalid book data",
  "Chapter limit exceeded",
  "Invalid file format",
  "Export format not supported",
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
  "Admin access required",
  "Invalid admin permissions",
  "System maintenance",
  "Rate limit exceeded",
  "API key invalid",
  "API key expired",
  "Quota exceeded",
  "Service unavailable",
  "Database error",
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
  "Email sent successfully",
  "Email delivery failed",
  "Email template not found",
  "Email queue full",
  "Email server error",
  "Email rate limit exceeded",
  "Email authentication failed",
  "Email connection failed",
  "Email configuration error",
  "Analytics data not available",
  "Analytics date range invalid",
  "Analytics query failed",
  "Analytics cache error",
  "Analytics database error",
  "Analytics processing timeout",
  "Analytics data corrupted",
  "Analytics export failed",
  "Analytics report generated",
  "Analytics statistics calculated",
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
  "Database error",
  "Cache error",
  "File system error",
  "Configuration error",
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
  "Request processed successfully",
  "Action cannot be undone",
  "Data will be permanently deleted",
  "This action may take some time",
  "Large file detected",
  "Processing may take longer",
  "Slow network detected",
  "Browser not optimized",
  "Feature may not work properly",
  "Compatibility issues detected",
  "Deprecated feature detected",
  "Welcome to the platform",
  "Getting started guide",
  "Documentation available",
  "Help center",
  "Contact support",
  "Report a bug",
  "Request a feature",
  "System status",
  "Last updated",
  "Beta feature",
  "New feature available",
  "Hotfix deployed",
  "Maintenance scheduled"
];

function findHardcodedInFiles(dir) {
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
          const matches = findHardcodedInFile(fullPath);
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
  
  scan(dir);
  return results;
}

function findHardcodedInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    HARDCODED_STRINGS.forEach((str, index) => {
      const regex = new RegExp(`"${str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        matches.push({
          string: str,
          line: lineNumber,
          file: relativePath
        });
      }
    });
    
    return matches;
  } catch (error) {
    return [];
  }
}

function checkAgainstJson(filePath, stringsToCheck) {
  try {
    const enContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const missingStrings = [];
    stringsToCheck.forEach(str => {
      let found = false;
      
      // JSON'da doğrudan eşleşme
      for (let key in enContent) {
        if (enContent[key] === str) {
          found = true;
          break;
        }
      }
      
      // JSON'da benzer anahtar arama
      if (!found) {
        const lowerStr = str.toLowerCase();
        for (let key in enContent) {
          if (key.toLowerCase().includes(lowerStr)) {
            found = true;
            break;
          }
        }
      }
      
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
  console.log('🔍 Ultimate hardcoded string arama başlatılıyor...');
  
  const sourceDir = path.join(__dirname, 'src');
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  // Tüm dosyalarda hardcoded stringleri bul
  const hardcodedResults = findHardcodedInFiles(sourceDir);
  
  // JSON'da olmayanları bul
  const missingStrings = checkAgainstJson(jsonFile, HARDCODED_STRINGS);
  
  console.log('\n📊 Tarama Sonuçları:');
  console.log(`Toplam hardcoded string: ${HARDCODED_STRINGS.length}`);
  console.log(`JSON'da olan: ${HARDCODED_STRINGS.length - missingStrings.length}`);
  console.log(`JSON'da olmayan: ${missingStrings.length}`);
  console.log(`Hardcoded içeren dosya sayısı: ${hardcodedResults.length}`);
  
  // JSON'a eksik stringleri ekle
  if (missingStrings.length > 0) {
    console.log('\n📋 JSON yapısı oluşturuluyor...');
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
      console.log('\n✅ JSON dosyası güncellendi!');
    } catch (error) {
      console.log('JSON güncelleme hatası:', error.message);
    }
  } else {
    console.log('\n✅ Tüm hardcoded stringler JSON\'da mevcut!');
  }
  
  // Detaylı hardcoded raporu
  console.log('\n📄 Hardcoded string detayları:');
  hardcodedResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.file}`);
    result.matches.forEach(match => {
      console.log(`   Satır ${match.line}: "${match.string}"`);
    });
  });
}

main();