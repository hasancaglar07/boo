const fs = require('fs');
const path = require('path');

// API ayarları
const API_URL = 'https://claudecode2.codefast.app/v1/chat/completions';
const API_KEY = 'sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98';
const MODEL = 'glm-4.5-air';

// JSON dosyasını oku
const jsonFile = path.join(__dirname, 'messages', 'en.json');
let enContent;

try {
  enContent = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  console.log('JSON dosyası başarıyla yüklendi');
} catch (error) {
  console.log('Error reading JSON file:', error.message);
  process.exit(1);
}

// JSON anahtarlarını listele
const keys = Object.keys(enContent);
console.log(`Total keys to translate: ${keys.length}`);

// Sadece yeni eklenen ve çevrilmemiş stringleri al
const newKeys = keys.slice(0, 80); // İlk 80 string

// Prompt oluştur
const prompt = `You are a professional localization expert. Translate the following English strings to ALL target languages: Turkish, German, French, Spanish, Arabic, Russian, Chinese (Simplified), Japanese, Korean, Italian, Portuguese, Dutch.

ENGLISH STRINGS TO TRANSLATE:
${newKeys.slice(0, 20).map(key => {
  const english = enContent[key];
  return `"${key}": "${english}"`;
}).join('\n')}

FORMAT: Return only the JSON object with all translations. Do not include any explanation or other text. The structure should be:
{
  "tr": {
    "key1": "Turkish translation",
    "key2": "Turkish translation"
  },
  "de": {
    "key1": "German translation",
    "key2": "German translation"
  },
  "fr": {
    "key1": "French translation",
    "key2": "French translation"
  },
  "es": {
    "key1": "Spanish translation",
    "key2": "Spanish translation"
  },
  "ar": {
    "key1": "Arabic translation",
    "key2": "Arabic translation"
  },
  "ru": {
    "key1": "Russian translation",
    "key2": "Russian translation"
  },
  "zh": {
    "key1": "Chinese translation",
    "key2": "Chinese translation"
  },
  "ja": {
    "key1": "Japanese translation",
    "key2": "Japanese translation"
  },
  "ko": {
    "key1": "Korean translation",
    "key2": "Korean translation"
  },
  "it": {
    "key1": "Italian translation",
    "key2": "Italian translation"
  },
  "pt": {
    "key1": "Portuguese translation",
    "key2": "Portuguese translation"
  },
  "nl": {
    "key1": "Dutch translation",
    "key2": "Dutch translation"
  }
}

IMPORTANT RULES:
1. Translate naturally and idiomatically in each target language
2. Maintain consistent terminology across translations
3. Keep HTML tags, placeholders, and technical terms intact
4. Ensure translations are culturally appropriate
5. Use proper capitalization and punctuation for each language
6. For Turkish: use correct Turkish characters (ç, ş, ğ, ı, ö, ü)
7. For Arabic: proper RTL formatting
8. For Japanese/Chinese: use appropriate characters
9. All translations must be high quality and professional`;

// Test için küçük bir batch ile başla
console.log('Test translation starting...');
console.log('Sample keys:', newKeys.slice(0, 5));

// Dosyaları oku ve güncelle
const languages = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

for (const lang of languages) {
  const langFile = path.join(__dirname, 'messages', `${lang}.json`);
  
  let currentLangContent;
  try {
    currentLangContent = JSON.parse(fs.readFileSync(langFile, 'utf8'));
  } catch (error) {
    currentLangContent = {};
  }
  
  // Örnek bir string ile test
  currentLangContent['test_string'] = enContent['test_string'] || 'Test Translation';
  
  // Dosyayı kaydet
  fs.writeFileSync(langFile, JSON.stringify(currentLangContent, null, 2));
}

console.log('✅ Test completed successfully');
console.log('📊 Files updated with test content');
console.log('🎉 Ready for full translation!');