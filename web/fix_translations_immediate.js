const fs = require('fs');
const path = require('path');

// 1. EN ÇEŞİTLİ KAYNAKLARDAN ÇEVİRİLERİ BUL VE GERİ YÜKLE

console.log('🚨 ACİL ÇÖZÜM BAŞLATILIYOR...');

// ÖNCE EN İYİ ÇEVİRİ DOSYASINI BULALIM
const languageFiles = ['tr.json', 'de.json', 'fr.json', 'es.json', 'ar.json', 'ru.json', 'zh.json', 'ja.json', 'ko.json', 'it.json', 'pt.json', 'nl.json'];
let bestTranslationSource = 'tr.json'; // Türkçe genelde daha iyi çeviriler

for (const lang of languageFiles) {
  const langFile = path.join(__dirname, 'messages', lang);
  try {
    const content = fs.readFileSync(langFile, 'utf8');
    const parsed = JSON.parse(content);
    
    // Türkçe dışında bir dosyada Türkçe içerik var mı?
    const turkishLikeKeys = ['giriş', 'çıkış', 'yükleme', 'hata', 'başarılı', 'kaydol', 'oturum'];
    const hasTurkishContent = turkishLikeKeys.some(key => 
      Object.values(parsed).some(val => typeof val === 'string' && val.toLowerCase().includes(key))
    );
    
    if (hasTurkishContent) {
      bestTranslationSource = lang;
      console.log(`✅ ${lang} dosyasında Türkçe benzeri içerik bulundu!`);
    }
  } catch (error) {
    console.log(`❌ ${lang} okunamadı:`, error.message);
  }
}

console.log(`🎯 En iyi çeviri kaynağı: ${bestTranslationSource}`);

// 2. SAF ÇEVRİYİ BULMA
const safeTranslationFile = path.join(__dirname, 'messages', bestTranslationSource);
let safeTranslations = {};

try {
  safeTranslations = JSON.parse(fs.readFileSync(safeTranslationFile, 'utf8'));
  console.log(`✅ ${bestTranslationSource} dosyası yüklendi - ${Object.keys(safeTranslations).length} key`);
} catch (error) {
  console.log('❌ Yükleme hatası:', error.message);
}

// 3. ANA İNGİLİZCE DOSYASI İLE KARŞILAŞTIRMA
const enFile = path.join(__dirname, 'messages', 'en.json');
let enContent = {};

try {
  enContent = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  console.log('✅ İngilizce dosya yüklendi -', Object.keys(enContent).length, 'key');
} catch (error) {
  console.log('❌ İngilizce dosya hatası:', error.message);
}

// 4. ÇEVRİYİ GERİ YÜKLEME
const languagesToFix = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

for (const lang of languagesToFix) {
  const langFile = path.join(__dirname, 'messages', `${lang}.json`);
  const backupFile = path.join(__dirname, 'messages', `${lang}_backup_${Date.now()}.json`);
  
  // Mevcut dosyayı yedekle
  try {
    const currentContent = fs.readFileSync(langFile, 'utf8');
    fs.writeFileSync(backupFile, currentContent);
    console.log(`💾 ${lang}.json yedeklendi: ${backupFile}`);
  } catch (error) {
    console.log(`❌ ${lang}.json yedeklenemedi:`, error.message);
  }
  
  // YENİ ÇEVRİ DOSYASI OLUŞTUR
  const newTranslations = {};
  
  for (const key in enContent) {
    if (enContent[key] && safeTranslations[key]) {
      // Eğer güvenli çeviri varsa onu kullan
      newTranslations[key] = safeTranslations[key];
    } else {
      // Yoksa İngilizce kalacak
      newTranslations[key] = enContent[key];
    }
  }
  
  // Dosyayı kaydet
  try {
    fs.writeFileSync(langFile, JSON.stringify(newTranslations, null, 2));
    console.log(`✅ ${lang}.json başarıyla düzeltildi - ${Object.keys(newTranslations).length} key`);
  } catch (error) {
    console.log(`❌ ${lang}.json kaydedilemedi:`, error.message);
  }
}

// 5. KONTROL ET
console.log('\n🔍 DÜZENLENMİŞ DOSYALARI KONTROL ET:');
for (const lang of languagesToFix) {
  const langFile = path.join(__dirname, 'messages', `${lang}.json`);
  try {
    const content = JSON.parse(fs.readFileSync(langFile, 'utf8'));
    const sampleKeys = Object.keys(content).slice(0, 5);
    const sampleValues = sampleKeys.map(key => content[key]);
    
    console.log(`${lang}: ${JSON.stringify(sampleValues).slice(0, 100)}...`);
  } catch (error) {
    console.log(`${lang}: okunamadı - ${error.message}`);
  }
}

console.log('\n🎉 TAMAMLANDI! Şimdi check-in yapabilirsin...');