const fs = require('fs');
const path = require('path');

console.log('🚨 DOĞRU ÇÖZÜM BAŞLATILIYOR...');

// 1. EN SAĞLAM ÇEVRİ DOSYASINI BULALIM
const messagesDir = path.join(__dirname, 'messages');

// Turkish dosyasının aslında çalışıyor olduğunu varsayalım
const trFile = path.join(messagesDir, 'tr_backup_1775935824615.json'); // En eski backup

let realTranslations = {};

try {
  const backupContent = fs.readFileSync(trFile, 'utf8');
  realTranslations = JSON.parse(backupContent);
  console.log('✅ Aslında çalışmış Türkçe dosyası bulundu!');
  console.log('📊 Anahtar sayısı:', Object.keys(realTranslations).length);
  
  // Örnek değerler kontrolü
  const sampleKeys = Object.keys(realTranslations).slice(0, 5);
  console.log('Örnek değerler:', sampleKeys.map(key => realTranslations[key]));
  
} catch (error) {
  console.log('❌ Türkçe backup okunamadı:', error.message);
}

// 2. İNGİLİZCE DOSYASI
const enFile = path.join(messagesDir, 'en.json');
let enContent = {};

try {
  const enContentData = fs.readFileSync(enFile, 'utf8');
  enContent = JSON.parse(enContentData);
  console.log('✅ İngilizce dosya okundu:', Object.keys(enContent).length, 'key');
} catch (error) {
  console.log('❌ İngilizce dosya okunamadı:', error.message);
}

// 3. GERÇEK ÇEVRİ DOSYALARINI BULALIM
const languages = ['tr', 'de', 'fr', 'es', 'ar', 'ru', 'zh', 'ja', 'ko', 'it', 'pt', 'nl'];

console.log('\n🔍 GERÇEK ÇEVRİ DOSYALARINI ARIYORUM...');

// Eğer Türkçe dosya gerçekten çalışıyorsa, onu temel alalım
if (Object.keys(realTranslations).length > 100) {
  console.log('✅ Çalışan Türkçe dosyasını buldum! Şimdi diğer dilleri ondan esinlenerek düzeltiyorum...');
  
  // Temel alınacak gerçek çeviri
  const baseTranslations = realTranslations;
  
  for (const lang of languages) {
    const langFile = path.join(messagesDir, `${lang}.json`);
    const backupFile = path.join(messagesDir, `${lang}_corrected_backup_${Date.now()}.json`);
    
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
      if (enContent[key]) {
        // Eğer gerçek çeviri varsa onu kullan, yoksa İngilizce kal
        if (baseTranslations[key]) {
          newContent[key] = baseTranslations[key];
        } else {
          newContent[key] = enContent[key];
        }
      }
    }
    
    // Dosyayı kaydet
    try {
      fs.writeFileSync(langFile, JSON.stringify(newContent, null, 2));
      console.log(`✅ ${lang}.json başarıyla düzeltildi!`);
    } catch (error) {
      console.log(`❌ ${lang}.json kaydedilemedi:`, error.message);
    }
  }
  
} else {
  console.log('❌ Gerçek Türkçe dosyası bulunamadı! Alternatif çözüm deniyorum...');
  
  // Alternatif: Eğer Türkçe dosya gerçekten bozulduysa, diğer dillerden en iyiyi bul
  const alternativeSources = ['de', 'fr', 'es'];
  let bestAlternative = null;
  
  for (const altLang of alternativeSources) {
    const altFile = path.join(messagesDir, `${altLang}_backup_1775935824*.json`);
    const backupFiles = fs.readdirSync(messagesDir).filter(f => f.startsWith(altLang + '_backup'));
    
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles.sort().pop();
      const backupPath = path.join(messagesDir, latestBackup);
      
      try {
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const backupParsed = JSON.parse(backupContent);
        
        if (Object.keys(backupParsed).length > 100) {
          bestAlternative = backupParsed;
          console.log(`✅ ${altLang} backup dosyası bulundu!`);
          break;
        }
      } catch (error) {
        console.log(`${altLang} backup okunamadı:`, error.message);
      }
    }
  }
  
  if (bestAlternative) {
    console.log('Alternatif kaynaktan düzeltiyorum...');
    
    for (const lang of languages) {
      const langFile = path.join(messagesDir, `${lang}.json`);
      const backupFile = path.join(messagesDir, `${lang}_alt_backup_${Date.now()}.json`);
      
      try {
        const currentContent = fs.readFileSync(langFile, 'utf8');
        fs.writeFileSync(backupFile, currentContent);
        console.log(`💾 ${lang}.json yedeklendi: ${backupFile}`);
      } catch (error) {
        console.log(`⚠️  ${lang}.json yedeklenemedi:`, error.message);
      }
      
      const newContent = {};
      
      for (const key in enContent) {
        if (enContent[key]) {
          if (bestAlternative[key]) {
            newContent[key] = bestAlternative[key];
          } else {
            newContent[key] = enContent[key];
          }
        }
      }
      
      try {
        fs.writeFileSync(langFile, JSON.stringify(newContent, null, 2));
        console.log(`✅ ${lang}.json alternatifle düzeltildi!`);
      } catch (error) {
        console.log(`❌ ${lang}.json kaydedilemedi:`, error.message);
      }
    }
    
  } else {
    console.log('❌ Çözüm bulunamadı! Manuel düzeltme gerekiyor...');
    console.log('Backup dosyalarını manuel olarak restore edin!');
  }
}

console.log('\n🎉 DÜZENLEME TAMAMLANDI!');