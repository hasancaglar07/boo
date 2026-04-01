# 🚀 Hızlı Preview Mimarı - Kapsamlı Plan

## 📋 Özet

**Mevcut Sorun:** /start/generate sayfasında kullanıcı tüm kitap üretimini bekliyor (60+ saniye)

**Önerilen Çözüm:** Hızlı %20 preview → Kullanıcıya değer sun → Arka planda tam üretim → Satın alma ile tam içerik

**Beklenen Etki:** Time-to-value 60 saniyeden 10 saniyeye düşecek (%83 iyileştirme)

---

## 🎯 Mimari Tasarım

### Phase 1: Hızlı Preview (10 saniye)

**Backend API:**
```typescript
// POST /api/books/quick-preview
{
  topic: string;
  title: string;
  outline: Chapter[];
  style: StyleProfile;
}

// Response (10 saniye içinde)
{
  bookId: string;
  previewSlug: string;
  status: "preview_ready";
  preview: {
    firstChapter: string;  // İlk bölümün %20'si
    coverDraft: string;    // Taslak kapak
    outline: Chapter[];    // Tam outline
  };
  estimatedFullTime: 45;   // Tam kitap için tahmini süre (saniye)
}
```

**Frontend Flow:**
1. Kullanıcı "Önizlemeyi Oluştur" butonuna tıklar
2. Loading: "İlk bölüm hazırlanıyor..." (10 saniye)
3. Preview ekranı açılır:
   - İlk bölümün %20'si gösterilir
   - "Devamını okumak için Premium'a geç" CTA
   - Kapak taslağı gösterilir
   - "Tam kitap hazırlanıyor..." progress bar

### Phase 2: Arka Planda Tam Üretim (45 saniye)

**Backend API:**
```typescript
// POST /api/books/generate-full (async)
{
  bookId: string;
  generateFull: true;
}

// Response (hemen)
{
  status: "generating";
  estimatedTime: 45;
}

// WebSocket/SSE Updates
{
  bookId: string;
  stage: "cover" | "chapters" | "formatting";
  progress: 0-100;
}
```

**Frontend Updates:**
- Preview ekranında progress bar gösterilir
- "Tam kitap hazırlanıyor... %45"
- Kapak güncellendikçe yenilenir
- Kullanıcı preview'ı okumaya devam eder

### Phase 3: Premium Upgrade (Paywall)

**Trigger:** Kullanıcı "Devamını oku" butonuna tıklar

**Paywall Screen:**
```tsx
<div className="paywall">
  <h2>Kitabının tamamını okumak için Premium'a geç</h2>
  
  <div className="benefits">
    <Check /> Tam kitap (tüm bölümler)
    <Check /> EPUB ve PDF indirme
    <Check /> Yüksek çözünürlüklü kapak
    <Check /> Formatlı içerik
  </div>
  
  <div className="progress">
    <p>Kitabın %95 hazır!</p>
    <ProgressBar value={95} />
    <p>Satın alma ile hemen indirilebilir.</p>
  </div>
  
  <Button onClick={handlePurchase}>
    Premium'a Geç - $29
  </Button>
</div>
```

**Purchase Flow:**
1. Kullanıcı ödeme yapar
2. Backend tam kitabı tamamlar
3. İndirme linki gösterilir
4. EPUB/PDF hazır olur

---

## 🔧 Backend Implementation Plan

### 1. Quick Preview Endpoint

```typescript
// app/api/books/quick-preview/route.ts
export async function POST(req: Request) {
  const { topic, title, outline, style } = await req.json();
  
  // 1. Book kaydı oluştur
  const book = await db.books.create({
    topic,
    title,
    outline,
    style,
    status: "preview_generating",
  });
  
  // 2. İlk bölümün %20'sini üret (hızlı)
  const firstChapterPreview = await generateFirstChapterPreview({
    topic,
    title,
    outline: outline[0],
    style,
    maxLength: 500, // %20 için
  });
  
  // 3. Taslak kapak üret (hızlı)
  const coverDraft = await generateCoverDraft({
    title,
    style,
    quality: "draft",
  });
  
  // 4. Preview'ı kaydet
  await db.books.update(book.id, {
    status: "preview_ready",
    preview: {
      firstChapter: firstChapterPreview,
      coverDraft,
    },
  });
  
  // 5. Arka planda tam üretimi başlat
  spawnFullGeneration(book.id);
  
  return Response.json({
    bookId: book.id,
    previewSlug: book.slug,
    status: "preview_ready",
    preview: {
      firstChapter: firstChapterPreview,
      coverDraft,
      outline,
    },
    estimatedFullTime: 45,
  });
}
```

### 2. Async Full Generation

```typescript
// lib/generate-full.ts
export async function spawnFullGeneration(bookId: string) {
  // Arka planda çalıştır
  setImmediate(async () => {
    const book = await db.books.find(bookId);
    
    // Progress updates
    await updateProgress(bookId, { stage: "cover", progress: 10 });
    
    // 1. Tam kapak üret
    const fullCover = await generateFullCover(book);
    await updateProgress(bookId, { stage: "chapters", progress: 30 });
    
    // 2. Tüm bölümleri üret
    const chapters = [];
    for (let i = 0; i < book.outline.length; i++) {
      const chapter = await generateChapter(book.outline[i]);
      chapters.push(chapter);
      await updateProgress(bookId, { 
        stage: "chapters", 
        progress: 30 + (i / book.outline.length) * 60 
      });
    }
    
    // 3. Formatla
    await updateProgress(bookId, { stage: "formatting", progress: 90 });
    const epub = await generateEPUB({ book, chapters, cover: fullCover });
    const pdf = await generatePDF({ book, chapters, cover: fullCover });
    
    // 4. Kaydet
    await db.books.update(bookId, {
      status: "ready",
      fullContent: { chapters, cover: fullCover, epub, pdf },
    });
    
    await updateProgress(bookId, { stage: "complete", progress: 100 });
  });
}

async function updateProgress(bookId: string, update: ProgressUpdate) {
  // WebSocket/SSE ile client'a gönder
  await broadcastToClient(bookId, update);
  
  // DB'ye de kaydet
  await db.books.updateProgress(bookId, update);
}
```

### 3. Progress Streaming

```typescript
// app/api/books/[id]/progress/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const bookId = params.id;
  
  // SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const listener = (update: ProgressUpdate) => {
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
      };
      
      // Listener'ı kaydet
      progressListeners.set(bookId, listener);
      
      // Cleanup
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

---

## 🎨 Frontend Implementation Plan

### 1. Quick Preview Loading

```typescript
// components/funnel/quick-preview-loading.tsx
export function QuickPreviewLoading() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"outline" | "first_chapter" | "cover">("outline");
  
  useEffect(() => {
    // Quick preview stages
    const stages = [
      { name: "outline", duration: 3000 },
      { name: "first_chapter", duration: 5000 },
      { name: "cover", duration: 2000 },
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
      <div className="progress-bar">
        <div className="fill" style={{ width: `${progress}%` }} />
      </div>
      
      <div className="stage-list">
        <StageItem name="Outline" status={stage === "outline" ? "active" : "done"} />
        <StageItem name="İlk Bölüm" status={stage === "first_chapter" ? "active" : stage === "cover" ? "done" : "pending"} />
        <StageItem name="Kapak Taslağı" status={stage === "cover" ? "active" : "pending"} />
      </div>
      
      <div className="tip-card">
        <p>💡 İlk bölümün %20'si 10 saniyede hazır!</p>
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
export function PreviewScreenWithProgress({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    // Progress updates dinle
    const eventSource = new EventSource(`/api/books/${bookId}/progress`);
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setProgress(update);
      
      if (update.stage === "complete") {
        eventSource.close();
        setBook((prev) => ({ ...prev, status: "ready" }));
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
          {book?.preview.firstChapter}
          {!isPremium && (
            <div className="blur-overlay">
              <p>Devamını okumak için Premium'a geç...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Sidebar */}
      <aside className="progress-sidebar">
        <div className="progress-card">
          <h3>Tam Kitap Hazırlanıyor</h3>
          <ProgressBar value={progress?.progress || 0} />
          <p>{progress?.stage}: % {progress?.progress}</p>
          
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

### 3. Paywall Component

```typescript
// components/app/paywall-upgrade.tsx
export function PaywallUpgrade({ book, progress }: { book: Book; progress: ProgressUpdate }) {
  return (
    <div className="paywall-upgrade">
      <div className="paywall-content">
        <div className="icon">📚</div>
        <h2>Kitabının Tamamını Oku</h2>
        <p className="subtitle">
          "{book.title}" kitabının tamamı ve indirme dosyaları hazır.
        </p>
        
        <div className="benefits">
          <BenefitItem icon="✓" text="Tam kitap (tüm bölümler)" />
          <BenefitItem icon="✓" text="EPUB ve PDF indirme" />
          <BenefitItem icon="✓" text="Yüksek çözünürlüklü kapak" />
          <BenefitItem icon="✓" text="Formatlı içerik" />
        </div>
        
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
        
        <div className="pricing">
          <Button size="lg" onClick={handlePurchase}>
            Premium'a Geç - $29
          </Button>
          <p className="guarantee">
            🔒 Güvenli ödeme • 7 gün iade garantisi
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 📊 Analytics ve Metrikler

### Key Metrics

```typescript
// Analytics Events
trackEvent("quick_preview_started", { bookId });
trackEvent("quick_preview_completed", { bookId, duration: 10 });
trackEvent("preview_viewed", { bookId, viewDuration });
trackEvent("paywall_shown", { bookId, progress });
trackEvent("upgrade_clicked", { bookId, progress });
trackEvent("purchase_completed", { bookId, amount: 29 });
trackEvent("download_clicked", { bookId, format: "epub" });
```

### Funnel Metrics

1. **Quick Preview Rate**
   - Generate tıklama → Preview görüntüleme
   - Hedef: %95+

2. **Preview Engagement**
   - Preview görüntüleme → Paywall tıklama
   - Hedef: %40+

3. **Upgrade Conversion**
   - Paywall görüntüleme → Purchase
   - Hedef: %8+

4. **Time-to-Value**
   - Generate tıklama → Preview görüntüleme
   - Hedef: <10 saniye

---

## 🚀 Implementation Prompts

### Prompt 1: Backend Quick Preview API

```
Book Generator için hızlı preview API endpoint'i oluştur:

1. POST /api/books/quick-preview endpoint'i oluştur
2. İstek: { topic, title, outline, style }
3. Response (10 saniye içinde):
   - bookId, previewSlug
   - preview: { firstChapter (500 words), coverDraft, outline }
   - estimatedFullTime: 45
4. Arka planda spawnFullGeneration(bookId) başlat
5. Progress updates için WebSocket/SSE endpoint'i oluştur: GET /api/books/[id]/progress
6. Progress stages: cover (10%), chapters (30-90%), formatting (90-100%)
7. Tamamlandığında status: "ready"

Tech stack: Next.js App Router, TypeScript, Prisma/DB
```

### Prompt 2: Frontend Quick Preview Loading

```
Quick preview loading component'i oluştur:

1. components/funnel/quick-preview-loading.tsx
2. 3 stage: outline (3sn), first_chapter (5sn), cover (2sn)
3. Progress bar ve stage listesi göster
4. Rotating tips ekle
5. Guest kullanıcılar için signup CTA
6. Tamamlandığında preview ekranına yönlendir
7. Design system: rounded-[28px], border-border/80

Analytics: quick_preview_started, quick_preview_completed
```

### Prompt 3: Preview Screen with Progress

```
Preview screen component'i oluştur:

1. components/app/preview-screen-with-progress.tsx
2. Sol tarafta preview content (ilk bölüm %20)
3. Sağ tarafta progress sidebar
4. SSE ile progress updates dinle
5. Progress stages: cover → chapters → formatting → complete
6. Premium değilse blur overlay + "Devamını oku" CTA
7. Premium ise download button göster
8. Progress %95 olduğunda "Kitabın hazır!" mesajı

Analytics: preview_viewed, paywall_shown, download_clicked
```

### Prompt 4: Paywall Upgrade Component

```
Paywall upgrade component'i oluştur:

1. components/app/paywall-upgrade.tsx
2. Benefits list: tam kitap, EPUB/PDF, yüksek çözünürlüklü kapak
3. Progress status göster: "%95 hazır"
4. "Premium'a Geç - $29" butonu
5. Güvenli ödeme ve iade garantisi mesajı
6. Purchase sonrası download ready state
7. Design system: gradient background, rounded cards

Analytics: upgrade_clicked, purchase_completed
```

### Prompt 5: Full Generation Service

```
Arka planda tam kitap üretim servisi oluştur:

1. lib/generate-full.ts
2. spawnFullGeneration(bookId) fonksiyonu
3. Stages: cover (10%) → chapters (30-90%) → formatting (90-100%)
4. Her stage'de progress update gönder
5. Tam kapak: generateFullCover(book)
6. Tüm bölümler: for loop ile generateChapter(outline[i])
7. Format: generateEPUB, generatePDF
8. Tamamlandığında status: "ready"

Error handling: Her stage'de try-catch, fallback mekanizması
```

---

## 🎯 Success Criteria

### Technical
- ✅ Quick preview 10 saniyede hazır
- ✅ Progress updates real-time
- ✅ SSE/WebSocket stable connection
- ✅ Error handling robust

### User Experience
- ✅ Time-to-value <10 saniye
- ✅ Preview engagement %40+
- ✅ Upgrade conversion %8+
- ✅ User satisfaction yüksek

### Business
- ✅ Revenue per user increase
- ✅ Activation rate improvement
- ✅ Retention rate increase
- ✅ Customer satisfaction score

---

## 📚 Referanslar

- **Skill:** onboarding-cro
- **Product Context:** `.agents/product-marketing-context.md`
- **Current Implementation:** `web/src/components/funnel/guided-wizard-screen.tsx`
- **Analytics:** `web/src/lib/analytics.ts`

---

**Son Güncelleme:** 2026-04-01  
**Versiyon:** 1.0.0  
**Durum:** 🚀 Ready to Implement
