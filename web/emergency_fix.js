const fs = require('fs');
const path = require('path');

// ANA İNGİLİZCE DOSYASI (SAĞLAM OLAN)
const enFile = path.join(__dirname, 'messages', 'en.json');
const backupFile = path.join(__dirname, 'messages', 'en_backup.json');
const trFile = path.join(__dirname, 'messages', 'tr.json');

console.log('🚨 ACİL DÜZELTME BAŞLATILIYOR...');

// 1. ÖNCE ANA İNGİLİZCE DOSYASINI KOPYALA
try {
  const enContent = fs.readFileSync(enFile, 'utf8');
  fs.writeFileSync(backupFile, enContent);
  console.log('✅ İngilizce dosya yedeklendi');
} catch (error) {
  console.log('❌ Yedekleme hatası:', error.message);
}

// 2. TÜM DİL DOSYALARINI İNGİLİZCE İLE DOLDURMAYA GİTME (BU YAPILMAMALI!)
console.log('📂 Kontrol edilecek dil dosyaları: tr, de, fr, es, ar, ru, zh, ja, ko, it, pt, nl');

const languages = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

for (const lang of languages) {
  const langFile = path.join(__dirname, 'messages', `${lang}.json`);
  
  try {
    const langContent = fs.readFileSync(langFile, 'utf8');
    const parsed = JSON.parse(langContent);
    
    const keyCount = Object.keys(parsed).length;
    console.log(`${lang}.json anahtar sayısı: ${keyCount}`);
    
    // İlk 5 anahtarı kontrol et
    const sampleKeys = Object.keys(parsed).slice(0, 5);
    const sampleValues = sampleKeys.map(key => parsed[key]);
    
    console.log(`${lang} - Örnek değerler:`, sampleValues);
    
    // Eğer değerler İngilizce görünüyor, uyari
    if (sampleValues.every(val => typeof val === 'string' && val.length > 10)) {
      console.log(`⚠️  ${lang}.json'da değerler İngilizce görünüyor!`);
    }
    
  } catch (error) {
    console.log(`${lang}.json okuma hatası:`, error.message);
  }
}

console.log('\n🔍 ÖNEMLİ KONTROL:');
console.log('1. Türkçe dosya (tr.json) hala Türkçe içeriyor mu?');
console.log('2. Eğer bozuldu, backup\'tan geri yükleme yapılacak');

// 3. TÜRKÇE DOSYAYI KONTROL ET
try {
  const trContent = fs.readFileSync(trFile, 'utf8');
  const trParsed = JSON.parse(trContent);
  
  console.log(`\n🇹🇷 Türkçe dosya anahtar sayısı: ${Object.keys(trParsed).length}`);
  
  // Örnek Türkçe kontrolü
  const commonKeys = ['login', 'register', 'loading', 'error', 'success'];
  let hasTurkishContent = false;
  
  for (const key of commonKeys) {
    if (trParsed[key] && typeof trParsed[key] === 'string') {
      // Temel İngilizce kelimelerle karşılaştır
      const englishWords = ['login', 'register', 'loading', 'error', 'success', 'cancel', 'save'];
      const isEnglish = englishWords.includes(trParsed[key].toLowerCase());
      
      if (!isEnglish && trParsed[key].length > 5) {
        hasTurkishContent = true;
        console.log(`✅ ${key}: "${trParsed[key]}" (Türkçe olabilir)`);
      } else {
        console.log(`⚠️  ${key}: "${trParsed[key]}" (İngilizce görünüyor)`);
      }
    }
  }
  
  if (!hasTurkishContent) {
    console.log('❌ TÜRKÇE DOSYA BOZULMUŞ OLABİLİR!');
  } else {
    console.log('✅ TÜRKÇE DOSYA GÖRÜNÜYOR SAĞLAM');
  }
  
} catch (error) {
  console.log(`❌ Türkçe dosya hatası:`, error.message);
}

console.log('\n🚀 DÜZENLEME İÇİN:');
console.log('1. Backup\'tan dosyaları geri yükle');
console.log('2. Sadece İngilizce dosyayı güncelle, diğerlerini dokunma');
console.log('3. Yeniden çeviride tekrar manuel kontrol yap');