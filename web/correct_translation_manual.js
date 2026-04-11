const fs = require('fs');
const path = require('path');

console.log('🚨 TEK TEK ÇEVİRİ YAPILIYOR...');

// API ayarları - GLM 4.5 AIR
const API_URL = 'https://claudecode2.codefast.app/v1/chat/completions';
const API_KEY = 'sk-aa9118949569889b72e4bb5123618ef9a36449952e379a98';
const MODEL = 'glm-4.5-air';

// Dosyaları oku
const enFile = path.join(__dirname, 'messages', 'en.json');
let enContent = {};

try {
  enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  console.log('✅ İngilizce dosya yüklendi:', Object.keys(enContent).length, 'key');
} catch (error) {
  console.log('❌ İngilizce dosya hatası:', error.message);
  process.exit(1);
}

// Dönüştürme fonksiyonu
function translateTextBatch(texts, targetLang, batchIndex) {
  const prompt = `You are a professional localization expert. Translate ONLY the following English text to ${targetLang}. Return ONLY the translation, nothing else.

TEXT TO TRANSLATE: "${texts[0]}"

TRANSLATION:`;

  const data = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 200
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(data)
  };

  return fetch(API_URL, options)
    .then(response => response.json())
    .then(data => {
      const translation = data.choices[0].message.content.trim();
      console.log(`✅ ${targetLang} - Batch ${batchIndex}: ${translation}`);
      return translation;
    })
    .catch(error => {
      console.error(`❌ ${targetLang} - Batch ${batchIndex} hata:`, error.message);
      return texts[0]; // Hata olursa orijinal metin kalır
    });
}

// Tek tek çeviri fonksiyonu
async function translateLanguage(lang, enContent) {
  console.log(`\n🌍 ${lang} çevirisi başlıyor...`);
  
  const langFile = path.join(__dirname, 'messages', `${lang}.json`);
  const backupFile = path.join(__dirname, 'messages', `${lang}_final_backup_${Date.now()}.json`);
  
  // Mevcut dosyayı yedekle
  try {
    const currentContent = fs.readFileSync(langFile, 'utf8');
    fs.writeFileSync(backupFile, currentContent);
    console.log(`💾 ${lang}.json yedeklendi: ${backupFile}`);
  } catch (error) {
    console.log(`⚠️  ${lang}.json yedeklenemedi:`, error.message);
  }
  
  // Yeni çeviri oluştur
  const translations = {};
  let batchIndex = 0;
  
  // Anahtarları batch'lerde işle
  const keys = Object.keys(enContent);
  const batchSize = 20;
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    batchIndex++;
    
    console.log(`${batchIndex}. Batch (${i+1}-${Math.min(i+batchSize, keys.length)}/${keys.length})...`);
    
    // Batch içindeki her anahtarı çevir
    for (const key of batch) {
      if (enContent[key]) {
        try {
          const translation = await translateTextBatch([enContent[key]], lang, batchIndex);
          translations[key] = translation;
        } catch (error) {
          console.log(`❌ ${key} çevrilemedi:`, error.message);
          translations[key] = enContent[key]; // Çeviri olmazsa orijinal kalır
        }
        
        // Her çeviriden sonra kısa bir bekle
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`${batchIndex}. Batch tamamlandı!`);
  }
  
  // Dosyayı kaydet
  try {
    fs.writeFileSync(langFile, JSON.stringify(translations, null, 2));
    console.log(`✅ ${lang}.json başarıyla oluşturuldu!`);
  } catch (error) {
    console.log(`❌ ${lang}.json kaydedilemedi:`, error.message);
  }
  
  return translations;
}

// Tüm dilleri çevir
const languages = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

// Türkçe hariç diğerlerini çevir (çünkü Türkçe genelde daha iyi)
const languagesToTranslate = languages.filter(lang => lang !== 'tr');

async function translateAll() {
  console.log('🚀 Tüm diller çeviriliyor...');
  
  for (const lang of languagesToTranslate) {
    await translateLanguage(lang, enContent);
    console.log(`\n--- ${lang} tamamlandı! ---`);
  }
  
  console.log('\n🎉 TÜM ÇEVİRİLER TAMAMLANDI!');
}

translateAll().catch(console.error);