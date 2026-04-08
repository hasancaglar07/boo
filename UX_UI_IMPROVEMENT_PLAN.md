# UX/UI İyileştirme Geliştirme Planı
**Başlangıç:** 2026-04-08  
**Tahmini Süre:** 3-5 gün  
**Toplam Görev:** 20+ düzeltim

---

## 📋 FAZ 1: KRİTİK BUG DÜZELTMELERİ (Gün 1)
**Süre:** 2-3 saat  
**Öncelik:** CRITICAL

### ✅ Görev 1.1: Yükleme Durumları Ekle
- [ ] WritingDashboard'de tüm AI workflow butonlarına loading state ekle
- [ ] Generate Outline butonu için spinner
- [ ] Generate Chapter butonu için spinner
- [ ] Review butonu için spinner
- [ ] Butonları disabled yap ve loading göstergesi ekle

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 686-734)

**Örnek Kod:**
```tsx
<Button 
  onClick={...}
  disabled={isLoading}
  className={isLoading ? "cursor-not-allowed opacity-70" : ""}
>
  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
  {isLoading ? "Generating..." : "Generate Outline"}
</Button>
```

### ✅ Görev 1.2: Klavye Kısayolu Çakışmalarını Düzelt
- [ ] Ctrl+Shift+S kısayolunu kaldır
- [ ] Sadece Ctrl+S bırak
- [ ] Açıklamayı güncelle

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 302-334)

### ✅ Görev 1.3: Tab Çubuğu Kaydırma Göstergeleri Ekle
- [ ] Sol ve sağ ok göstergeleri ekle
- [ ] Scroll pozisyonuna göre opaklık değiştir
- [ ] Mobil için swipe göstergesi ekle

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 460-466)

**Örnek Kod:**
```tsx
<div className="relative">
  {canScrollLeft && (
    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
  )}
  <div className="overflow-x-auto" ref={scrollContainerRef}>
    <TabsList className="w-max min-w-full">
      {tabOptions.map((tab) => (
        <TabsTrigger key={tab} value={tab}>{TAB_LABELS[tab]}</TabsTrigger>
      ))}
    </TabsList>
  </div>
  {canScrollRight && (
    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
  )}
</div>
```

---

## 📋 FAZ 2: YÜKSEK ÖNCELİK İYİLEŞTİRMELER (Gün 2)
**Süre:** 4-6 saat  
**Öncelik:** HIGH

### ✅ Görev 2.1: Ana Tab Yeniden Tasarım
- [ ] İstatistik kartlarını 4'ten 3'e düşür
- [ ] Sadece en önemli metrikleri tut: Chapter, Research, Output
- [ ] Draft durumunu kaldır veya progress bar'a entegre et
- [ ] Progress bar'ı daha belirgin hale getir
- [ ] Next step kartını üste taşı ve vurgula

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 468-532)

### ✅ Görev 2.2: Kitap Tab Form Yerleşimini İyileştir
- [ ] Formu 3 Card bölümüne ayır:
  - Kitap Bilgileri (Title, Subtitle, ISBN, Year)
  - Yazar Bilgileri (Author, Publisher, Author Bio)
  - Marka (Branding, Logo, Cover Brief)
- [ ] Her bölüm için net başlıklar ekle
- [ ] Boşluk artır (space-y-4 → space-y-6)
- [ ] Grid yapısını iyileştir (md:grid-cols-2 → md:grid-cols-1)

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 535-647)

### ✅ Görev 2.3: Yazma Tab Alt Sekmeleri Ekle
- [ ] 3 alt tab oluştur:
  - Genel Bakış (WritingDashboard, TimeTracker, GoalTracker)
  - Editör (ChapterEditor, ChapterTemplates)
  - Analitik (OutlinePreview, Workflow buttons)
- [ ] Varsayılan olarak "Genel Bakış" açık
- [ ] Tab navigasyonu ekle

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 650-781)

### ✅ Görev 2.4: Bölüm Editörü İyileştirmesi
- [ ] İlk bölümü varsayılan olarak açık yap
- [ ] "Tümünü Aç/Kapat" butonu ekle
- [ ] Bölüm başlığına kelime sayısı göster
- [ ] Aktif bölümü vurgula

**Dosyalar:**
- `web/src/components/writing/chapter-editor.tsx`

### ✅ Görev 2.5: Araştırma Tab Boş Durumunu Düzelt
- [ ] Boş durumda örnek araştırma dosyaları göster
- [ ] "İlk araştırmayı başlat" CTA ekle
- [ ] Her buton için kısa açıklama ekle
- [ ] Kullanım örnekleri göster

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 784-811)
- `web/src/components/common/enhanced-file-list.tsx`

### ✅ Görev 2.6: Yayınlama Tab Dışa Aktarma Akışını Düzelt
- [ ] Pre-check butonunu farklı renkte yap (warning color)
- [ ] Export butonlarını grupla
- [ ] Başarı durumunu modal ile göster
- [ ] Export geçmişini sınırla (son 12 yerine son 20)

**Dosyalar:**
- `web/src/components/app/workspace-screen.tsx` (lines 814-844)

---

## 📋 FAZ 3: ORTA ÖNCELİK İYİLEŞTİRMELER (Gün 3-4)
**Süre:** 4-6 saat  
**Öncelik:** MEDIUM

### ✅ Görev 3.1: Boşluk Sistemini Standartlaştır
- [ ] Tüm space-y-* değerlerini space-y-4 yap
- [ ] Card içeriklerinde space-y-4 kullan
- [ ] Tab içeriklerinde space-y-6 kullan
- [ ] Konsistent padding (p-4, p-6)

**Dosyalar:**
- Tüm workspace bileşenleri

### ✅ Görev 3.2: Boş Durumları İyileştir
- [ ] ChapterEditor: "Henüz bölüm yok. İlk bölümü oluşturun."
- [ ] EnhancedFileList: "Henüz dosya yok. Araştırma başlatın."
- [ ] OutlinePreview: "Henüz taslak yok. Generate Outline butonuna tıklayın."
- [ ] Her boş durumda CTA butonu ekle

**Dosyalar:**
- `web/src/components/writing/chapter-editor.tsx`
- `web/src/components/common/enhanced-file-list.tsx`
- `web/src/components/writing/outline-preview.tsx`

### ✅ Görev 3.3: Button Hiyerarşisini Düzelt
- [ ] Primary actions: `Button` (default)
- [ ] Secondary actions: `Button variant="outline"`
- [ ] Tertiary actions: `Button variant="ghost"`
- [ ] Destructive actions: `Button variant="destructive"`
- [ ] Tüm tablarda tutarlı uygula

**Dosyalar:**
- Tüm workspace bileşenleri

### ✅ Görev 3.4: Progress Bar Tutarsızlığını Düzelt
- [ ] Tüm progress bar'ları h-2 yap
- [ ] Tutarsız renkleri düzelt
- [ ] Animated transition ekle

**Dosyalar:**
- `web/src/components/writing/writing-dashboard.tsx`
- `web/src/components/writing/goal-tracker.tsx`
- `web/src/components/writing/chapter-editor.tsx`

### ✅ Görev 3.5: Mobil Uyumluluğu İyileştir
- [ ] Grid breakpoint'leri düzelt:
  - Stats: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Book form: `grid-cols-1 md:grid-cols-2`
- [ ] Tab bar mobilde dropdown yap
- [ ] Touch target boyutlarını 44px'e çıkar
- [ ] Fixed width'leri max-width ile değiştir

**Dosyalar:**
- Tüm workspace bileşenleri

---

## 📋 FAZ 4: DÜŞÜK ÖNCELİK İYİLEŞTİRMELER (Gün 4-5)
**Süre:** 2-4 saat  
**Öncelik:** LOW

### ✅ Görev 4.1: Klavye Kısayolları Yardımı Ekle
- [ ] Keyboard shortcuts help modal ekle
- [ ] `?` tuşu ile aç
- [ ] Tüm kısayolları listele
- [ ] Bottom-right help icon ekle

**Dosyalar:**
- Yeni: `web/src/components/common/keyboard-shortcuts-help.tsx`

### ✅ Görev 4.2: Geri Alma İşlevi Ekle
- [ ] Silme işlemleri için undo toast ekle
- [ ] 5 saniye geri sayım
- [ ] "Geri al" butonu
- [ ] Soft delete implement et

**Dosyalar:**
- `web/src/components/writing/chapter-editor.tsx`
- `web/src/components/common/enhanced-file-list.tsx`

### ✅ Görev 4.3: Toplu İşlemler Ekle
- [ ] Chapter editorde bulk select ekle
- [ ] Bulk delete, bulk move
- [ ] Checkbox column ekle
- [ ] "Hepsini seç" butonu

**Dosyalar:**
- `web/src/components/writing/chapter-editor.tsx`

### ✅ Görev 4.4: Hover Durumlarını İyileştir
- [ ] Tüm interactive elementlere hover state ekle
- [ ] Cursor pointer ekle
- [ ] Subtle background change
- [ ] Transition animation

**Dosyalar:**
- Tüm workspace bileşenleri

### ✅ Görev 4.5: Renk Kontrastını Düzelt
- [ ] text-muted-foreground rengini test et
- [ ] WCAG AA standartlarına uygun hale getir
- [ ] Kontrast oranı en az 4.5:1
- [ ] Dark mode kontrolü

**Dosyalar:**
- Tüm workspace bileşenleri

---

## 📋 FAZ 5: ERİŞİLEBİLİRLİK İYİLEŞTİRMELERİ (Gün 5)
**Süre:** 3-4 saat  
**Öncelik:** ACCESSIBILITY

### ✅ Görev 5.1: ARIA Etiketleri Ekle
- [ ] Tüm icon-only buttons'a aria-label ekle
- [ ] Expandable sections'a aria-expanded ekle
- [ ] Progress bar'lara aria-valuenow ekle
- [ ] Form input'larına aria-describedby ekle

**Dosyalar:**
- Tüm workspace bileşenleri

### ✅ Görev 5.2: Klavye Navigasyonunu Düzelt
- [ ] Tüm interactive elements tab accessible
- [ ] Focus ring'leri düzelt
- [ ] Tab order mantıklı sırala
- [ ] Skip link ekle

**Dosyalar:**
- Tüm workspace bileşenleri

### ✅ Görev 5.3: Renk ve İkon Kullanımı
- [ ] Color-only indicators'a icon/text ekle
- [ ] Status badges için icon kullan
- [ ] Progress bar'lara percentage text ekle
- [ ] Color-blind friendly palette

**Dosyalar:**
- Tüm workspace bileşenleri

### ✅ Görev 5.4: Odak Yönetimini Düzelt
- [ ] Modals'da focus trap ekle
- [ ] Dialog kapatıldığında focus'u geri döndür
- [ ] Auto-focus ilk input'a
- [ ] Escape key ile kapat

**Dosyalar:**
- `web/src/components/writing/chapter-comments.tsx`
- `web/src/components/common/enhanced-file-list.tsx`

---

## 📊 TEST PLANI

### Her Faz Sonrası:
1. ✅ Görsel regression test
2. ✅ Fonksiyonel test
3. ✅ Responsive test (mobile, tablet, desktop)
4. ✅ Accessibility test (axe DevTools)
5. ✅ Performance test (Lighthouse)

### Kullanıcı Testleri:
- [ ] 5 kullanıcı ile task-based test
- [ ] System usability scale (SUS) survey
- [ ] Qualitative feedback

---

## 🎯 BAŞARI METRIKLERI

### Önce (Mevcut Durum):
- Task completion rate: ~60%
- Average task time: ~5 dakika
- User satisfaction: 5/10
- Accessibility score: 65/100

### Hedef (İyileştirme Sonrası):
- Task completion rate: ~90%
- Average task time: ~2 dakika
- User satisfaction: 8/10
- Accessibility score: 90/100

---

## 📅 ZAMAN ÇİZELGESİ

| Faz | Gün | Saat | Durum |
|-----|-----|------|-------|
| Faz 1: Kritik Bug'lar | 1 | 2-3 | ⏳ Pending |
| Faz 2: Yüksek Öncelik | 2 | 4-6 | ⏳ Pending |
| Faz 3: Orta Öncelik | 3-4 | 4-6 | ⏳ Pending |
| Faz 4: Düşük Öncelik | 4-5 | 2-4 | ⏳ Pending |
| Faz 5: Erişilebilirlik | 5 | 3-4 | ⏳ Pending |
| Test & Deploy | 5 | 2-3 | ⏳ Pending |

**Toplam:** 5 gün, 17-26 saat

---

## 🚀 BAŞLAMA ÖNCESİ

1. ✅ Git branch oluştur: `ux-ui-improvements`
2. ✅ Bu planı onayla
3. ✅ Backup al
4. ✅ Feature flags hazırla (opsiyonel)

---

## 📝 NOTLAR

- Her task tamamlandığında işaretle
- Beklenmedik sorunları not et
- Kullanıcı geri bildirimini kaydet
- İterasyon yap

---

**Plan Hazırlayan:** Claude Code  
**Onay Durumu:** Bekliyor  
**Başlangıç Tarihi:** Onay sonrası
