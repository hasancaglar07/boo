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

// Batch işlem için anahtarları grupla
const batchSize = 40;
const batches = [];
for (let i = 0; i < keys.length; i += batchSize) {
  const batch = keys.slice(i, i + batchSize);
  batches.push(batch);
}

console.log(`Total batches: ${batches.length}`);

// Dil dosyalarını oku ve güncelle
const languages = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

for (const lang of languages) {
  const langFile = path.join(__dirname, 'messages', `${lang}.json`);
  
  let currentLangContent;
  try {
    currentLangContent = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    console.log(`${lang}.json mevcut, içeriği güncellenecek`);
  } catch (error) {
    currentLangContent = {};
    console.log(`${lang}.json oluşturuldu`);
  }
  
  // Tüm anahtarları kopyala
  for (const key of keys) {
    if (enContent[key]) {
      currentLangContent[key] = enContent[key]; // Şimdilik İngilizce olarak ayarla, sonrasında çevrilecek
    }
  }
  
  // Dosyayı kaydet
  fs.writeFileSync(langFile, JSON.stringify(currentLangContent, null, 2));
  console.log(`${lang}.json güncellendi - ${Object.keys(currentLangContent).length} key`);
}

console.log('✅ All language files updated with English content');
console.log('🎉 Ready for full translation process!');
console.log('📊 Total keys per language:', keys.length);
console.log('🌍 Languages covered:', languages.join(', '));