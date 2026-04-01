# 🚀 Ultra Hızlı Preview Mimarı - Gelişmiş Prompt

## 🎯 Hedef

**Kullanıcı Deneyimi + Pazarlama + Hız = Mükemmel Onboarding**

Kullanıcıyı bekletmeden, heyecanlandırarak ve doğrudan ödeme ekranına yönlendirerek time-to-value'yi 60 saniyeden 5 saniyeye düşür.

---

## 🎨 Kullanıcı Deneyimi Stratejisi

### 1. **Instant Gratification (Anında Ödül)**

**Mevcut:** 60 saniye bekleyip kitap görüyor
**Yeni:** 5 saniyede kitabını görüyor, heyecanlanıyor

**Psychology:**
- Dopamine hit: Anında sonuç
- Momentum: Hızla devam etme isteği
- Investment: Zaten zaman harcadı, devam etsin

### 2. **Progressive Disclosure (Aşamalı Açıklama)**

**Phase 1: Instant Preview (5 saniye)**
```
"Kitabın hazır! 🎉"
- Kapak taslağı (AI generated, hızlı)
- İlk bölümün ilk 2 paragrafı
- "Devamını okumak için Premium'a geç" CTA
```

**Phase 2: Background Generation (30 saniye)**
```
"Tam kitap hazırlanıyor..."
- Progress bar: %25 → %50 → %75 → %100
- Kapak güncellenir (draft → final)
- Kullanıcı preview'ı okumaya devam eder
```

**Phase 3: Premium Upgrade (Trigger)**
```
"Kitabının tamamı hazır! 📚"
- Progress: %100 completed
- "Şimdi indir" butonu aktif
- EPUB/PDF hazır
```

### 3. **Scarcity & Urgency (Kıtlık ve Aciliyet)**

**Tactics:**
- "İlk 100 kullanıcıya özel %50 indirim"
- "Bu fiyat sadece 24 saat geçerli"
- "Sadece 5 kitap daha bu fiyatta"

**Implementation:**
```tsx
<div className="urgency-banner">
  <p>⚡ Fırsat: İlk 100 kullanıcıya %50 indirim!</p>
  <p>Kalan: {100 - userCount} kitap</p>
</div>
```

### 4. **Social Proof (Sosyal Kanıt)**

**Tactics:**
- "Bu hafta 237 kitap üretildi"
- "⭐⭐⭐⭐⭐ 4.9/5 kullanıcı puanı"
- "Son 24 saatte 45 kullanıcı kitabını indirdi"

**Implementation:**
```tsx
<div className="social-proof">
  <div className="stats">
    <Stat icon="📖" value="237" label="Bu hafta üretildi" />
    <Stat icon="⭐" value="4.9" label="Kullanıcı puanı" />
    <Stat icon="⏰" value="45" label="Son 24 saat" />
  </div>
</div>
```

---

## 💰 Pazarlama Stratejisi

### 1. **Value Stacking (Değer Yığınlığı)**

**Tactics:**
- Kitap değeri: $500+ (ghostwriter fiyatı)
- Sunduğumuz fiyat: $29
- Tasarruf: %94+

**Implementation:**
```tsx
<div className="value-stack">
  <div className="original-price">
    <span className="label">Ghostwriter Fiyatı:</span>
    <span className="value">$500+</span>
  </div>
  <div className="your-price">
    <span className="label">Sizin Fiyatınız:</span>
    <span className="value">$29</span>
  </div>
  <div className="savings">
    <span className="label">Tasarruf:</span>
    <span className="value">%94+</span>
  </div>
</div>
```

### 2. **Risk Reversal (Risk Tersine Çevirme)**

**Tactics:**
- 7 gün iade garantisi
- "Memnun kalmazsan para iade"
- "Hiçbir risk yok"

**Implementation:**
```tsx
<div className="risk-reversal">
  <div className="guarantee">
    <div className="icon">🛡️</div>
    <div className="content">
      <h3>7 Gün İade Garantisi</h3>
      <p>Memnun kalmazsanız, tam para iadesi. Hiçbir risk yok.</p>
    </div>
  </div>
</div>
```

### 3. **Anchoring (Çapalandırma)**

**Tactics:**
- Yüksek fiyat göster ($500)
- İndirimli fiyat göster ($29)
- Perceived value artar

**Implementation:**
```tsx
<div className="price-anchor">
  <div className="high-price">$500</div>
  <div className="arrow">↓</div>
  <div className="low-price">$29</div>
  <div className="badge">%94 TASARRUF</div>
</div>
```

### 4. **Loss Aversion (Kayıp Korkusu)**

**Tactics:**
- "Bu fırsatı kaçırma"
- "Sadece 5 kitap kaldı"
- "Fiyat yakında artacak"

**Implementation:**
```tsx
<div className="loss-aversion">
  <p>⚠️ Dikkat: Bu fiyat sadece 24 saat geçerli!</p>
  <p>Sonra fiyat $49'a çıkacak.</p>
</div>
```

---

## ⚡ Hız Optimizasyonu

### 1. **Parallel Processing (Paralel İşleme)**

**Mevcut:** Sequential (sıralı)
```typescript
// 60 saniye total
const outline = await generateOutline();     // 10s
const cover = await generateCover();         // 20s
const chapters = await generateChapters();   // 30s
```

**Yeni:** Parallel (paralel)
```typescript
// 5 saniye total
const [outline, cover, firstChapter] = await Promise.all([
  generateOutline(),           // 3s
  generateCoverDraft(),        // 2s
  generateFirstChapterPreview(), // 4s
]);
// Max: 4 saniye (longest task)
```

### 2. **Lazy Loading (Tembel Yükleme)**

**Strategy:**
- Preview: Hemen yükle (critical)
- Tam kapak: Arka planda yükle (non-critical)
- Tüm bölümler: İsteğe bağlı yükle (lazy)

**Implementation:**
```typescript
// Critical: Hemen yükle
const preview = await loadPreview();

// Non-critical: Arka planda yükle
setTimeout(() => loadFullCover(), 0);

// Lazy: İsteğe bağlı yükle
const loadFullChapter = (id) => lazyLoad(() => import(`./chapters/${id}`));
```

### 3. **Caching (Önbellekleme)**

**Strategy:**
- Outline'ı cache'le
- Kapak taslaklarını cache'le
- AI modellerini cache'le

**Implementation:**
```typescript
// Cache layer
const cache = new Map();

async function generateWithCache(key, fn) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const result = await fn();
  cache.set(key, result);
  return result;
}

// Usage
const outline = await generateWithCache(
  `outline:${topic}`,
  () => generateOutline(topic)
);
```

### 4. **Streaming (Akış)**

**Strategy:**
- İlk sonuçları hemen göster
- Gerisini stream et
- Kullanıcı beklemez

**Implementation:**
```typescript
// Streaming response
async function* streamChapter(topic) {
  const stream = await aiClient.stream.completions.create({
    model: "gpt-4",
    prompt: topic,
  });

  for await (const chunk of stream) {
    yield chunk.content;
  }
}

// Usage
for await (const content of streamChapter(topic)) {
  appendToPreview(content);
}
```

---

## 🎯 Gelişmiş Prompt

```
Book Generator için ultra hızlı preview ve premium upgrade sistemi oluştur.

## HEDEF
Time-to-value'yi 60 saniyeden 5 saniyeye düşür. Kullanıcıyı bekletme, heyecanlandır, doğrudan ödeme ekranına yönlendir.

## MİMARİ

### Phase 1: Instant Preview (5 saniye)
1. Kullanıcı "Önizlemeyi Oluştur" butonuna tıklar
2. Loading: "Kitabın hazırlanıyor..." (5 saniye)
3. Preview ekranı açılır:
   - Kapak taslağı (AI generated, 2 saniye)
   - İlk bölümün ilk 2 paragrafı (AI generated, 3 saniye)
   - "Devamını okumak için Premium'a geç" CTA
   - Progress bar: "Tam kitap hazırlanıyor... %25"

### Phase 2: Background Generation (30 saniye)
1. Arka planda paralel işleme:
   - Tam kapak üretimi (10 saniye)
   - Tüm bölümler üretimi (20 saniye)
2. Real-time progress updates:
   - %25 → %50 → %75 → %100
   - Kapak güncellenir (draft → final)
3. Kullanıcı preview'ı okumaya devam eder

### Phase 3: Premium Upgrade (Trigger)
1. Kullanıcı "Devamını oku" butonuna tıklar
2. Paywall ekranı açılır:
   - "Kitabının tamamı hazır! 📚"
   - Progress: %100 completed
   - Value stack: $500 → $29 (%94 tasarruf)
   - Social proof: "Bu hafta 237 kitap üretildi"
   - Urgency: "İlk 100 kullanıcıya %50 indirim"
   - Risk reversal: "7 gün iade garantisi"
   - CTA: "Şimdi İndir - $29"

## BACKEND IMPLEMENTATION

### 1. Quick Preview Endpoint
```typescript
// POST /api/books/quick-preview
export async function POST(req: Request) {
  const { topic, title, outline, style } = await req.json();
  
  // 1. Book kaydı oluştur
  const book = await db.books.create({
    topic, title, outline, style,
    status: "preview_generating",
  });
  
  // 2. PARALLEL: Hızlı preview üret (5 saniye)
  const [coverDraft, firstChapterPreview] = await Promise.all([
    generateCoverDraft({ title, style, quality: "draft" }),      // 2s
    generateFirstChapterPreview({ topic, title, outline, style }), // 3s
  ]);
  
  // 3. Preview'ı kaydet
  await db.books.update(book.id, {
    status: "preview_ready",
    preview: { coverDraft, firstChapterPreview },
  });
  
  // 4. ARKA PLANDA: Tam üretimi başlat (async)
  spawnFullGeneration(book.id);
  
  // 5. Response (5 saniye içinde)
  return Response.json({
    bookId: book.id,
    previewSlug: book.slug,
    status: "preview_ready",
    preview: { coverDraft, firstChapterPreview },
    estimatedFullTime: 30,
  });
}
```

### 2. Async Full Generation
```typescript
// lib/generate-full.ts
export async function spawnFullGeneration(bookId: string) {
  // Arka planda çalıştır (non-blocking)
  setImmediate(async () => {
    const book = await db.books.find(bookId);
    
    // Progress: %25
    await updateProgress(bookId, { stage: "cover", progress: 25 });
    
    // PARALLEL: Tam kapak + tüm bölümler
    const [fullCover, chapters] = await Promise.all([
      generateFullCover(book),              // 10s
      generateAllChapters(book),            // 20s
    ]);
    
    // Progress: %75
    await updateProgress(bookId, { stage: "formatting", progress: 75 });
    
    // Formatla
    const [epub, pdf] = await Promise.all([
      generateEPUB({ book, chapters, cover: fullCover }),
      generatePDF({ book, chapters, cover: fullCover }),
    ]);
    
    // Progress: %100
    await db.books.update(bookId, {
      status: "ready",
      fullContent: { chapters, cover: fullCover, epub, pdf },
    });
    
    await updateProgress(bookId, { stage: "complete", progress: 100 });
  });
}

async function generateAllChapters(book) {
  // PARALLEL: Tüm bölümleri aynı anda üret
  const chapters = await Promise.all(
    book.outline.map(chapter => generateChapter(chapter))
  );
  return chapters;
}
```

### 3. Progress Streaming (SSE)
```typescript
// GET /api/books/[id]/progress
export async function GET(req: Request, { params }) {
  const bookId = params.id;
  
  const stream = new ReadableStream({
    async start(controller) {
      const listener = (update) => {
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
      };
      
      progressListeners.set(bookId, listener);
      
      req.signal.addEventListener('abort', () => {
        progressListeners.delete(bookId);
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## FRONTEND IMPLEMENTATION

### 1. Quick Preview Loading (5 saniye)
```typescript
// components/funnel/quick-preview-loading.tsx
export function QuickPreviewLoading() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("cover");
  
  useEffect(() => {
    // Ultra hızlı stages
    const stages = [
      { name: "cover", duration: 2000 },
      { name: "first_chapter", duration: 3000 },
    ];
    
    let currentStage = 0;
    
    const timer = setInterval(() => {
      if (currentStage < stages.length) {
        setStage(stages[currentStage].name);
        setProgress((currentStage / stages.length) * 100);
        currentStage++;
      } else {
        clearInterval(timer);
      }
    }, stages[currentStage]?.duration || 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="quick-preview-loading">
      <div className="hero">
        <h1>🎉 Kitabın Hazır!</h1>
        <p>İlk bölümün hazırlandı. Hemen okumaya başla!</p>
      </div>
      
      <div className="progress-bar">
        <div className="fill" style={{ width: `${progress}%` }} />
      </div>
      
      <div className="stage-list">
        <StageItem name="Kapak Taslağı" status={stage === "cover" ? "active" : "done"} />
        <StageItem name="İlk Bölüm" status={stage === "first_chapter" ? "active" : "done"} />
      </div>
      
      <div className="tip-card">
        <p>💡 Tam kitap 30 saniyede hazır!</p>
      </div>
      
      <div className="signup-cta">
        <p>🎁 Kitabını kaybetme</p>
        <Button onClick={handleSignup}>Hesabına Bağla</Button>
      </div>
    </div>
  );
}
```

### 2. Preview Screen with Progress
```typescript
// components/app/preview-screen-with-progress.tsx
export function PreviewScreenWithProgress({ bookId }) {
  const [book, setBook] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    // Progress updates dinle (SSE)
    const eventSource = new EventSource(`/api/books/${bookId}/progress`);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setProgress(update);
      
      if (update.stage === "complete") {
        eventSource.close();
        setBook(prev => ({ ...prev, status: "ready" }));
      }
    };
    
    return () => eventSource.close();
  }, [bookId]);
  
  return (
    <div className="preview-screen">
      {/* Preview Content */}
      <div className="preview-content">
        <h1>{book?.title}</h1>
        <div className="chapter-preview">
          {book?.preview.firstChapterPreview}
          {!isPremium && (
            <div className="blur-overlay">
              <Button onClick={handleUpgrade}>
                Devamını Okumak İçin Premium'a Geç
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Sidebar */}
      <aside className="progress-sidebar">
        <div className="progress-card">
          <h3>Tam Kitap Hazırlanıyor</h3>
          <ProgressBar value={progress?.progress || 0} />
          <p>%{progress?.progress} tamamlandı</p>
          
          {progress?.stage === "complete" && isPremium && (
            <div className="download-ready">
              <p>✅ Kitabın hazır!</p>
              <Button onClick={handleDownload}>İndir</Button>
            </div>
          )}
          
          {!isPremium && (
            <div className="upgrade-prompt">
              <p>Tam kitap için Premium'a geç</p>
              <Button onClick={handleUpgrade}>Upgrade - $29</Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
```

### 3. Premium Paywall (Marketing Odaklı)
```typescript
// components/app/premium-paywall.tsx
export function PremiumPaywall({ book, progress }) {
  return (
    <div className="premium-paywall">
      <div className="paywall-content">
        {/* Hero */}
        <div className="hero">
          <div className="icon">📚</div>
          <h1>Kitabının Tamamını Oku</h1>
          <p>"{book.title}" kitabının tamamı ve indirme dosyaları hazır.</p>
        </div>
        
        {/* Value Stack */}
        <div className="value-stack">
          <div className="original-price">
            <span className="label">Ghostwriter Fiyatı:</span>
            <span className="value">$500+</span>
          </div>
          <div className="your-price">
            <span className="label">Sizin Fiyatınız:</span>
            <span className="value">$29</span>
          </div>
          <div className="savings">
            <span className="label">Tasarruf:</span>
            <span className="value">%94+</span>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="benefits">
          <BenefitItem icon="✓" text="Tam kitap (tüm bölümler)" />
          <BenefitItem icon="✓" text="EPUB ve PDF indirme" />
          <BenefitItem icon="✓" text="Yüksek çözünürlüklü kapak" />
          <BenefitItem icon="✓" text="Formatlı içerik" />
        </div>
        
        {/* Progress Status */}
        <div className="progress-status">
          <div className="progress-header">
            <span>Kitap Hazırlık Durumu</span>
            <span className="percentage">%{progress.progress}</span>
          </div>
          <ProgressBar value={progress.progress} />
          <p className="status-text">
            {progress.stage === "complete" 
              ? "✅ Tamamlandı! Satın alma ile hemen indir."
              : "⏳ Hazırlanıyor... Satın alma ile tamamlandığında bildirim al."}
          </p>
        </div>
        
        {/* Social Proof */}
        <div className="social-proof">
          <div className="stats">
            <Stat icon="📖" value="237" label="Bu hafta üretildi" />
            <Stat icon="⭐" value="4.9" label="Kullanıcı puanı" />
            <Stat icon="⏰" value="45" label="Son 24 saat" />
          </div>
        </div>
        
        {/* Urgency */}
        <div className="urgency">
          <p>⚡ Fırsat: İlk 100 kullanıcıya %50 indirim!</p>
          <p>Kalan: {100 - userCount} kitap</p>
        </div>
        
        {/* Risk Reversal */}
        <div className="risk-reversal">
          <div className="guarantee">
            <div className="icon">🛡️</div>
            <div className="content">
              <h3>7 Gün İade Garantisi</h3>
              <p>Memnun kalmazsanız, tam para iadesi. Hiçbir risk yok.</p>
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="pricing">
          <Button size="lg" onClick={handlePurchase}>
            Şimdi İndir - $29
          </Button>
          <p className="guarantee-text">
            🔒 Güvenli ödeme • 7 gün iade garantisi
          </p>
        </div>
      </div>
    </div>
  );
}
```

## ANALYTICS

Track et:
- quick_preview_started
- quick_preview_completed (hedef: 5sn)
- preview_viewed
- paywall_shown
- upgrade_clicked
- purchase_completed
- download_clicked

## SUCCESS CRITERIA

- Time-to-Value: <5 saniye
- Preview Engagement: %50+
- Upgrade Conversion: %12+
- User Satisfaction: 4.8/5

## TECH STACK

- Next.js App Router
- TypeScript
- Prisma/DB
- SSE (Server-Sent Events)
- Parallel Processing (Promise.all)
- Caching (Map/Redis)
```

---

## 🎯 Ek İpuçları

### 1. **Micro-Interactions**
```tsx
// Button hover effects
<Button className="hover:scale-105 active:scale-95 transition-transform">
  Şimdi İndir
</Button>

// Progress bar animation
<div className="progress-fill animate-pulse" />
```

### 2. **Sound Effects**
```tsx
// Success sound
const playSuccessSound = () => {
  const audio = new Audio('/sounds/success.mp3');
  audio.play();
};

// Usage
{progress.stage === "complete" && playSuccessSound()}
```

### 3. **Confetti Animation**
```tsx
// Celebration
{progress.stage === "complete" && (
  <Confetti
    particleCount={100}
    spread={70}
    origin={{ y: 0.6 }}
  />
)}
```

### 4. **Smooth Scrolling**
```tsx
// Auto scroll to content
useEffect(() => {
  if (book?.preview) {
    document.getElementById('preview')?.scrollIntoView({
      behavior: 'smooth',
    });
  }
}, [book]);
```

---

## 📚 Referanslar

- **Skill:** onboarding-cro
- **Product Context:** `.agents/product-marketing-context.md`
- **Current Implementation:** `web/src/components/funnel/guided-wizard-screen.tsx`
- **Analytics:** `web/src/lib/analytics.ts`

---

**Son Güncelleme:** 2026-04-01  
**Versiyon:** 2.0.0  
**Durum:** 🚀 Ultra Hızlı + Pazarlama Odaklı
