const fs = require('fs');
const path = require('path');

console.log('🔍 EN İYİ ÇEVRİ DOSYALARINI BULUYORUM...');

const messagesDir = path.join(__dirname, 'messages');

// Tüm çeviri dosyalarını oku
const allTranslations = {};

try {
  const files = fs.readdirSync(messagesDir);
  
  files.forEach(file => {
    if (file.endsWith('.json') && !file.includes('backup')) {
      const lang = file.replace('.json', '');
      const filePath = path.join(messagesDir, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        
        // Türkçe karakter kontrolü yapalım
        const hasTurkishChars = ['ç', 'ş', 'ğ', 'ı', 'ö', 'ü', 'é', 'è', 'ê', 'ë', 'à', 'â', 'î', 'ô', 'û'].some(char => 
          JSON.stringify(parsed).includes(char)
        );
        
        const hasForeignChars = ['中文', '日本語', 'العربية', 'Русский', 'Deutsch', 'Français', 'Español'].some(char => 
          JSON.stringify(parsed).includes(char)
        );
        
        const keyCount = Object.keys(parsed).length;
        
        allTranslations[lang] = {
          content: parsed,
          keyCount: keyCount,
          hasTurkishChars: hasTurkishChars,
          hasForeignChars: hasForeignChars,
          filePath: filePath
        };
        
        console.log(`${lang}: ${keyCount} keys, Türkçe: ${hasTurkishChars}, Yabancı: ${hasForeignChars}`);
        
      } catch (error) {
        console.log(`${file} okunamadı:`, error.message);
      }
    }
  });
  
} catch (error) {
  console.log('Mesajlar dizini okunamadı:', error.message);
}

// En iyi çevriyi bulalım - hangisi en kaliteli?
let bestLang = 'en';
let bestScore = 0;

console.log('\n🎯 EN İYİ ÇEVİRİ SKORLARI:');

for (const lang in allTranslations) {
  const data = allTranslations[lang];
  
  // Skor hesaplama
  let score = 0;
  
  // Anahtar sayısı (daha fazla daha iyi)
  score += data.keyCount * 0.1;
  
  // Türkçe karakterler (Türkçe için avantaj)
  if (lang === 'tr' && data.hasTurkishChars) score += 50;
  
  // Yabancı karakterler (yabancı diller için avantaj)
  if (lang !== 'en' && data.hasForeignChars) score += 30;
  
  // Dil kalitesi kontrolü
  const sampleValues = Object.values(data.content).slice(0, 10);
  const nonEmptyCount = sampleValues.filter(val => val && val !== '').length;
  score += (nonEmptyCount / 10) * 20;
  
  console.log(`${lang}: ${score.toFixed(1} puan`);
  
  if (score > bestScore) {
    bestScore = score;
    bestLang = lang;
  }
}

console.log(`\n🏆 EN İYİ ÇEVİRİ: ${bestLang} (${bestScore.toFixed(1)} puan)`);

// Şimdi bu en iyi çevriyi kullanarak diğer dosyaları düzeltelim
console.log('\n🔧 EN İYİ ÇEVRİ İLE DOSYALARI DÜZELTİYORUM...');

const bestContent = allTranslations[bestLang].content;
const enContent = allTranslations['en'].content;

const languagesToFix = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

for (const lang of languagesToFix) {
  if (lang === bestLang) continue; // En iyisi zaten düzgün
  
  const langFile = path.join(messagesDir, `${lang}.json`);
  const backupFile = path.join(messagesDir, `${lang}_final_backup_${Date.now()}.json`);
  
  // Mevcut dosyayı yedekle
  try {
    const currentContent = fs.readFileSync(langFile, 'utf8');
    fs.writeFileSync(backupFile, currentContent);
    console.log(`💾 ${lang}.json yedeklendi: ${backupFile}`);
  } catch (error) {
    console.log(`⚠️  ${lang}.json yedeklenemedi:`, error.message);
  }
  
  // YENİ DOSYA OLUŞTUR
  const newContent = {};
  
  for (const key in enContent) {
    if (enContent[key] && bestContent[key]) {
      // Eğer en iyi çeviri varsa onu kullan
      newContent[key] = bestContent[key];
    } else {
      // Yoksa İngilizce kalacak
      newContent[key] = enContent[key];
    }
  }
  
  // Dosyayı kaydet
  try {
    fs.writeFileSync(langFile, JSON.stringify(newContent, null, 2));
    console.log(`✅ ${lang}.json başarıyla düzeltildi - ${Object.keys(newContent).length} key`);
  } catch (error) {
    console.log(`❌ ${lang}.json kaydedilemedi:`, error.message);
  }
}

console.log('\n🎉 TAMAMLANDI! Şimdi check et...');