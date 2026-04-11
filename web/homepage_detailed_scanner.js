const fs = require('fs');
const path = require('path');

// Anasayfada hardcoded stringler
const DETAILED_HOMEPAGE_STRINGS = [
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
  
  // Interactive book showcase
  "PDF",
  "EPUB",
  "HTML",
  "Book Open",
  "Arrow Right",
  "File Text",
  "Download",
  "badge",
  "title",
  "description",
  "ctaLabel",
  "ctaHref",
  
  // Home testimonials
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
  "Trusted by authors",
  "5-star rated",
  "Real success stories",
  "Verified reviews",
  
  // Home blog preview
  "Latest articles",
  "Read our blog",
  "Latest updates",
  "Industry news",
  "Writing tips",
  "Success stories",
  "Expert advice",
  "Case studies",
  "New posts",
  "Recent articles",
  "Popular topics",
  "Trending now",
  
  // Marketing CTA
  "Start writing today",
  "Get started free",
  "Create your book now",
  "Try it risk-free",
  "Begin your journey",
  "Start your project",
  "Join thousands of authors",
  "Publish your first book",
  "Begin your book creation",
  "Start your author journey",
  "Write your book effortlessly",
  "Create your masterpiece",
  
  // FAQ section
  "How does it work?",
  "What formats do you support?",
  "Is it beginner friendly?",
  "What's the delivery time?",
  "Do you offer refunds?",
  "Can I modify the book?",
  "Is it KDP compatible?",
  "How much does it cost?",
  "What about editing?",
  "Can I change the style?",
  "How long does it take?",
  "Is there a free trial?",
  
  // Newsletter section
  "Subscribe to our newsletter",
  "Enter your email",
  "Subscribe",
  "Get updates",
  "Stay informed",
  "Join our community",
  "Don't miss out",
  "Weekly tips",
  "Get notified",
  "Join our mailing list",
  "Stay connected",
  "Get exclusive content",
  
  // Trust badges
  "Secure checkout",
  "SSL encrypted",
  "Privacy protected",
  "24/7 support",
  "Money back guarantee",
  "Satisfaction guaranteed",
  "No hidden fees",
  "Transparent pricing",
  "Industry standard",
  "Certified safe",
  "Banking level security",
  "GDPR compliant",
  
  // Common UI elements
  "Read more",
  "Learn more",
  "Discover more",
  "Explore",
  "View details",
  "See examples",
  "Browse library",
  "Browse templates",
  "View all",
  "Show more",
  "Show less",
  "View gallery",
  "See portfolio",
  
  // Navigation elements
  "Home",
  "Dashboard",
  "Pricing",
  "How it works",
  "Examples",
  "FAQ",
  "Contact",
  "About",
  "Blog",
  "Resources",
  "Tools",
  "Templates",
  "Support",
  "Help",
  "Documentation",
  "Community",
  "Forum",
  "Discord",
  "GitHub",
  
  // Status indicators
  "Loading...",
  "Processing",
  "Generating",
  "Exporting",
  "Downloading",
  "Saving",
  "Uploading",
  "Complete",
  "Success",
  "Error",
  "Failed",
  "Pending",
  "In progress",
  "Ready",
  "Available",
  "Out of stock",
  "Limited time",
  "New arrival",
  
  // Form elements
  "Search",
  "Filter",
  "Sort",
  "Clear",
  "Apply",
  "Reset",
  "Submit",
  "Cancel",
  "Delete",
  "Edit",
  "Save",
  "Update",
  "Create",
  "Add",
  "Remove",
  "Import",
  "Export",
  "Download",
  "Upload",
  "Browse",
  "Choose file",
  "Select file",
  "Drag and drop",
  "Click to upload",
  "No files selected",
  "Maximum size",
  "Allowed formats",
  "Required",
  "Optional",
  "Email",
  "Password",
  "Name",
  "Phone",
  "Address",
  "City",
  "Country",
  "Zip code",
  "Date",
  "Time",
  "Yes",
  "No",
  "True",
  "False",
  "On",
  "Off",
  "Active",
  "Inactive",
  "Enabled",
  "Disabled",
  "Public",
  "Private",
  "Draft",
  "Published",
  "Archived",
  "Deleted",
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "Completed",
  "Failed",
  "Success",
  "Error",
  "Warning",
  "Info",
  "Help",
  "Contact",
  "Support",
  "Documentation",
  "Tutorial",
  "Guide",
  "Manual",
  "FAQ",
  "Documentation",
  "Help center",
  "Contact us",
  "Get help",
  "Send message",
  "Contact form",
  "Send inquiry",
  "Request demo",
  "Schedule call",
  "Book consultation",
  "Get quote",
  "Call us",
  "Email us",
  "Visit us",
  "Find us",
  "Location",
  "Address",
  "Directions",
  "Map",
  "Directions",
  "Transport",
  "Parking",
  "Access",
  "Entrance",
  "Exit",
  "Open",
  "Closed",
  "Opening hours",
  "Working hours",
  "Business hours",
  "Contact hours",
  "24 hours",
  "All day",
  "Weekend",
  "Weekdays",
  "Holidays",
  "Public holidays",
  "Bank holidays",
  "School holidays",
  "Summer holidays",
  "Winter holidays",
  "Spring holidays",
  "Autumn holidays",
  "Public transport",
  "Private transport",
  "Car",
  "Bus",
  "Train",
  "Subway",
  "Metro",
  "Tram",
  "Taxi",
  "Uber",
  "Lyft",
  "Bicycle",
  "Walking",
  "Parking",
  "Free parking",
  "Paid parking",
  "Street parking",
  "Garage parking",
  "Valet parking",
  "Disabled parking",
  "Electric vehicle",
  "Charging station",
  "EV charging",
  "Solar charging",
  "Wind charging",
  "Hydro charging",
  "Nuclear charging",
  "Coal charging",
  "Gas charging",
  "Oil charging",
  "Biofuel charging",
  "Hydrogen charging",
  "Fuel cell",
  "Battery",
  "Solar panel",
  "Wind turbine",
  "Hydroelectric",
  "Nuclear",
  "Coal",
  "Gas",
  "Oil",
  "Biofuel",
  "Hydrogen",
  "Fuel cell",
  "Battery storage",
  "Solar storage",
  "Wind storage",
  "Hydro storage",
  "Nuclear storage",
  "Coal storage",
  "Gas storage",
  "Oil storage",
  "Biofuel storage",
  "Hydrogen storage",
  "Fuel cell storage"
];

function findDetailedHardcodedInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const matches = [];
    const lines = content.split('\n');
    
    // Daha gelişmiş regex patterns
    const patterns = [
      // Temel hardcoded stringler
      DETAILED_HOMEPAGE_STRINGS.map(s => `"${s}"`).join('|'),
      // Sadece büyük harfle başlayan 3+ kelimelik stringler
      /[A-Z][A-Za-z\s]{10,}/g,
      // Tek tırnak içindeki stringler
      /'[^']{10,}'/g,
      // Template literal içindeki stringler
      /`[^`]{10,}`/g,
      // className içindeki stringler
      /className="[^"]{10,}"/g,
      // value attributes
      /value="[^"]{10,}"/g,
      // placeholder attributes
      /placeholder="[^"]{10,}"/g
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
        } else if (string.includes('className="')) {
          string = string.match(/className="([^"]+)"/)?.[1] || string;
        } else if (string.includes('value="')) {
          string = string.match(/value="([^"]+)"/)?.[1] || string;
        } else if (string.includes('placeholder="')) {
          string = string.match(/placeholder="([^"]+)"/)?.[1] || string;
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

function scanDetailedHomepageFiles() {
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
          results.push(...scanDirectory(fullPath));
        } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js'))) {
          // Sadece homepage ile ilgili dosyaları tarayalım
          if (dirPath.includes('page') || dirPath.includes('home') || dirPath.includes('premium') || dirPath.includes('marketing') || dirPath.includes('interactive') || dirPath.includes('testimonials') || dirPath.includes('faq') || dirPath.includes('newsletter') || dirPath.includes('cta')) {
            const matches = findDetailedHardcodedInFile(fullPath);
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

function checkDetailedAgainstJson(jsonFile, allFoundStrings) {
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
  console.log('🔍 Detailed homepage hardcoded string scanner başlatılıyor...');
  
  const jsonFile = path.join(__dirname, 'messages', 'en.json');
  
  // Homepage dosyalarında hardcoded stringleri bul
  const detailedResults = scanDetailedHomepageFiles();
  
  // Bulunan tüm stringleri topla
  const allFoundStrings = [];
  detailedResults.forEach(result => {
    result.matches.forEach(match => {
      if (!allFoundStrings.includes(match.string)) {
        allFoundStrings.push(match.string);
      }
    });
  });
  
  console.log(`Toplam unique hardcoded string bulundu: ${allFoundStrings.length}`);
  console.log(`Dosya sayısı hardcoded string içeriyor: ${detailedResults.length}`);
  
  // JSON'da olmayanları bul
  const missingStrings = checkDetailedAgainstJson(jsonFile, allFoundStrings);
  
  console.log(`JSON\'da olmayan hardcoded stringler: ${missingStrings.length}`);
  
  if (missingStrings.length > 0) {
    console.log('\n📋 Detailed homepage hardcoded stringler:');
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
      console.log('\n✅ JSON dosyası detailed homepage hardcoded stringlerle güncellendi!');
      
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
  console.log('\n📄 Detaylı homepage hardcoded string taraması:');
  detailedResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.file}`);
    result.matches.forEach(match => {
      console.log(`   Satır ${match.line}: "${match.string}"`);
    });
  });
}

main();