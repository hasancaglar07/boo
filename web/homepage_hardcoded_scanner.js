const fs = require('fs');
const path = require('path');

// Anasayfada hardcoded stringler
const HOMEPAGE_STRINGS = [
  // Premium book hero
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
  "generate outline",
  "apply style",
  "create preview",
  "export book",
  "finalize",
  "complete!",
  "auto-save",
  "save draft",
  "save chapter",
  "delete chapter",
  "move up",
  "move down",
  "insert chapter",
  "chapter comments",
  "add comment",
  "reply",
  "resolve comment",
  "unresolved comment",
  "word count",
  "character count",
  "reading time",
  "estimated completion",
  
  // Home sections
  "Publish your authority book",
  "Authority in 100 pages",
  "Silent offers",
  "Prompt systems for small teams",
  "Uzmanlığını kitaba dönüştür",
  "Focus by design",
  "Tu método hecho libro",
  "IA Prática para Pequenos Negócios",
  "Parent-friendly STEM at home",
  "The Art of Clickbait",
  "The Compound Effect",
  "Trust Microcopy",
  "Read more",
  
  // Features
  "AI-powered writing",
  "Professional editing",
  "KDP optimized",
  "Multiple formats",
  "Fast delivery",
  "24/7 support",
  "Money-back guarantee",
  "Easy to use",
  "No technical skills",
  "Professional design",
  "Print ready",
  "Digital ready",
  
  // Testimonials
  "Amazing results",
  "Professional quality",
  "Time saver",
  "Excellent support",
  "Highly recommended",
  "Game changer",
  "Exactly what I needed",
  "Perfect for beginners",
  "Outstanding service",
  "Great value",
  
  // FAQ section
  "How does it work?",
  "What formats do you support?",
  "Is it beginner friendly?",
  "What's the delivery time?",
  "Do you offer refunds?",
  "Can I modify the book?",
  "Is it KDP compatible?",
  "How much does it cost?",
  
  // CTA section
  "Start writing today",
  "Get started free",
  "Create your book now",
  "Try it risk-free",
  "Begin your journey",
  "Start your project",
  "Join thousands of authors",
  "Publish your first book",
  
  // Newsletter
  "Subscribe to our newsletter",
  "Enter your email",
  "Subscribe",
  "Get updates",
  "Stay informed",
  "Join our community",
  "Don't miss out",
  "Weekly tips",
  
  // Blog preview
  "Latest articles",
  "Read our blog",
  "Latest updates",
  "Industry news",
  "Writing tips",
  "Success stories",
  "Expert advice",
  "Case studies",
  
  // Social proof
  "Trusted by thousands",
  "Used by professionals",
  "Featured in",
  "Award winning",
  "Industry leader",
  "Top rated",
  "Recommended by",
  "Partnered with",
  
  // Trust badges
  "Secure checkout",
  "SSL encrypted",
  "Privacy protected",
  "24/7 support",
  "Money back guarantee",
  "Satisfaction guaranteed",
  "No hidden fees",
  "Transparent pricing"
];

function findHomepageHardcodedInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    const regex = new RegExp(`(${HOMEPAGE_STRINGS.join('|')})`, 'g');
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

function scanHomepageFiles() {
  const homepageDir = path.join(__dirname, 'src', 'app');
  const componentsDir = path.join(__dirname, 'src', 'components');
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  function scanDirectory(dirPath) {
    const results = [];
    
    try {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          // Alt dizinleri tarayalım
          if (item === 'app' || item === 'components') {
            results.push(...scanDirectory(fullPath));
          }
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          // Sadece homepage ile ilgili dosyaları tarayalım
          if (dirPath.includes('page') || dirPath.includes('home') || dirPath.includes('premium') || dirPath.includes('marketing')) {
            const matches = findHomepageHardcodedInFile(fullPath);
            if (matches.length > 0) {
              results.push({
                file: fullPath,
                matches: matches
              });
            }
          }
        }
      });
    } catch (error) {
      console.log(`Dizin taranamadı: ${dirPath}`);
    }
    
    return results;
  }
  
  return scanDirectory(homepageDir);
}

function checkHomepageAgainstJson(jsonFile, stringsToCheck) {
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
  console.log('🔍 Homepage hardcoded string scanner başlatılıyor...');
  
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  // Homepage dosyalarında hardcoded stringleri bul
  const homepageResults = scanHomepageFiles();
  
  console.log(`Homepage dosyaları tarama tamamlandı: ${homepageResults.length} dosya hardcoded string içeriyor`);
  
  // JSON'da olmayanları bul
  const missingStrings = checkHomepageAgainstJson(jsonFile, HOMEPAGE_STRINGS);
  
  console.log(`Toplam hardcoded string: ${HOMEPAGE_STRINGS.length}`);
  console.log(`JSON\'da olan: ${HOMEPAGE_STRINGS.length - missingStrings.length}`);
  console.log(`JSON\'da olmayan: ${missingStrings.length}`);
  
  // JSON'a eksik stringleri ekle
  if (missingStrings.length > 0) {
    console.log('\n📋 Homepage hardcoded stringler:');
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
      console.log('\n✅ JSON dosyası homepage hardcoded stringlerle güncellendi!');
      
      console.log('\n📊 Homepage hardcoded detayları:');
      homepageResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.file}`);
        result.matches.forEach(match => {
          console.log(`   Satır ${match.line}: "${match.string}"`);
        });
      });
      
    } catch (error) {
      console.log('JSON güncelleme hatası:', error.message);
    }
  } else {
    console.log('\n✅ Tüm homepage hardcoded stringler JSON\'da mevcut!');
  }
}

main();