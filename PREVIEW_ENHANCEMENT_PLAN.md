# Preview Page Enhancement Plan
**Date:** 2026-04-09  
**Target:** `/app/book/[slug]/preview` page  
**Goal:** Add PDF/EPUB downloads, manual cover uploads, rate limiting, and improve background processing

---

## 📊 CURRENT STATE ANALYSIS

### Existing Features:
✅ Preview content display (first 20%)  
✅ Book mockup with cover  
✅ Upgrade prompts ($4)  
✅ Background polling (4-8 second intervals)  
✅ Auto-refresh during generation  
✅ Mobile responsive with floating button  
✅ TOC and book details sidebar  

### Missing Features:
❌ PDF/EPUB download buttons  
❌ Manual cover upload (front/back)  
❌ Rate limiting for regeneration  
❌ Regeneration buttons  
❌ Export history display  
❌ Background service worker (stops when tab closes)  

---

## 🎯 REQUIREMENTS

### 1. PDF & EPUB Downloads
**Premium Users Only**
- Add download buttons in sidebar
- Check `preview.entitlements?.can_view_full_book`
- Use existing `buildBook()` API
- Show loading state during generation
- Add export history

**Location:** Sidebar (below "Unlock Full Access" card)

### 2. Manual Cover Upload
**Front & Back Cover**
- Add "Change Cover" button
- File input: PNG, JPG, WebP (max 4MB)
- Use existing `uploadBookAsset()` API
- Update book metadata
- Refresh preview after upload
- Rate limit: 1 front cover + 1 back cover per session

**Location:** Below book mockup in sidebar

### 3. Rate Limiting for Regeneration
**Max 1 Rewrite + 1 Cover per Book**
- Track regeneration count in localStorage
- Store: `{slug}_regeneration_count`
- Structure: `{ rewrite: number, cover_front: number, cover_back: number }`
- Disable buttons when limit reached
- Show countdown or "limit reached" message
- Reset on new book creation

**Validation:**
- Rewrite: `rewrite_count < 1`
- Front Cover: `cover_front_count < 1`
- Back Cover: `cover_back_count < 1`

### 4. Background Processing
**Service Worker for Offline Generation**
- Register service worker
- Store task in IndexedDB
- Sync with server when online
- Show notification when complete
- Continue generation when tab closes

**Implementation:**
- Create `preview-service-worker.ts`
- Register in `app/layout.tsx`
- Add background sync API
- Store regeneration tasks

---

## 🏗️ ARCHITECTURE

### Component Structure
```
BookPreviewScreen
├── Hero Section
│   ├── Book Mockup
│   └── Download Buttons (NEW)
├── Content Section
│   ├── Visible Sections
│   └── Locked Sections
└── Sidebar
    ├── TOC
    ├── Download Buttons (NEW - Premium)
    ├── Change Cover Buttons (NEW)
    │   ├── Front Cover Upload
    │   └── Back Cover Upload
    └── Book Details
```

### Data Flow
```
User Action → Rate Limit Check → API Call → Update State → Show Success/Error
     ↓
LocalStorage Update (track counts)
     ↓
Service Worker (background tasks)
```

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Download Buttons (1-2 hours)
**Tasks:**
1. Add `buildBook` API import
2. Create download button component
3. Add loading states
4. Add export history display
5. Test PDF/EPUB generation

**Files:**
- `web/src/components/funnel/book-preview-screen.tsx`
- `web/src/lib/dashboard-api.ts` (already has buildBook)

### Phase 2: Manual Cover Upload (1-2 hours)
**Tasks:**
1. Add file input refs
2. Create upload handlers
3. Add validation (file type, size)
4. Update book metadata
5. Refresh preview after upload
6. Add rate limiting UI

**Files:**
- `web/src/components/funnel/book-preview-screen.tsx`
- `web/src/lib/dashboard-api.ts` (already has uploadBookAsset)

### Phase 3: Rate Limiting (1 hour)
**Tasks:**
1. Create localStorage utility
2. Add regeneration counter
3. Add validation logic
4. Disable buttons when limit reached
5. Show limit reached message
6. Add reset logic

**Files:**
- `web/src/lib/regeneration-limiter.ts` (NEW)
- `web/src/components/funnel/book-preview-screen.tsx`

### Phase 4: Background Processing (2-3 hours)
**Tasks:**
1. Create service worker
2. Register in app layout
3. Add IndexedDB storage
4. Implement background sync
5. Add notification support
6. Test tab closure scenario

**Files:**
- `web/public/preview-service-worker.js` (NEW)
- `web/src/app/layout.tsx`
- `web/src/lib/background-tasks.ts` (NEW)

---

## 🎨 UI/UX DESIGN

### Download Buttons (Premium)
```tsx
<Card>
  <CardContent className="p-4 space-y-3">
    <div className="text-xs font-semibold">Download Book</div>
    <div className="grid gap-2">
      <Button
        variant="outline"
        className="justify-start"
        disabled={isGeneratingPdf}
        onClick={handleGeneratePdf}
      >
        <Upload className="mr-2 size-4" />
        <div className="text-left">
          <div className="font-medium">Get PDF</div>
          <div className="text-xs text-muted-foreground">
            Print-ready format
          </div>
        </div>
      </Button>
      <Button
        variant="outline"
        className="justify-start"
        disabled={isGeneratingEpub}
        onClick={handleGenerateEpub}
      >
        <Upload className="mr-2 size-4" />
        <div className="text-left">
          <div className="font-medium">Get EPUB</div>
          <div className="text-xs text-muted-foreground">
            Standard e-book format
          </div>
        </div>
      </Button>
    </div>
    {exports.length > 0 && (
      <div className="pt-2 border-t">
        <div className="text-xs text-muted-foreground mb-2">
          Recent exports
        </div>
        {exports.slice(0, 3).map(exp => (
          <ExportItem key={exp.id} export={exp} />
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

### Cover Upload Buttons
```tsx
<Card>
  <CardContent className="p-4 space-y-3">
    <div className="text-xs font-semibold">Customize Covers</div>
    <div className="grid gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={coverFrontCount >= 1}
        onClick={() => frontCoverInputRef.current?.click()}
      >
        <ImagePlus className="mr-2 size-4" />
        Change Front Cover
        {coverFrontCount >= 1 && (
          <span className="ml-auto text-xs text-muted-foreground">
            Limit reached
          </span>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={coverBackCount >= 1}
        onClick={() => backCoverInputRef.current?.click()}
      >
        <ImagePlus className="mr-2 size-4" />
        Change Back Cover
        {coverBackCount >= 1 && (
          <span className="ml-auto text-xs text-muted-foreground">
            Limit reached
          </span>
        )}
      </Button>
    </div>
    <input
      ref={frontCoverInputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={handleFrontCoverUpload}
    />
    <input
      ref={backCoverInputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp"
      className="hidden"
      onChange={handleBackCoverUpload}
    />
  </CardContent>
</Card>
```

### Rate Limiting Display
```tsx
{rewriteCount >= 1 && (
  <Alert variant="warning">
    <AlertCircle className="size-4" />
    <AlertDescription>
      Rewrite limit reached (1/1). Contact support for assistance.
    </AlertDescription>
  </Alert>
)}
```

---

## 🔧 TECHNICAL DETAILS

### API Calls
```typescript
// Generate PDF
async function handleGeneratePdf() {
  setIsGeneratingPdf(true);
  try {
    const response = await buildBook(slug, {
      format: "pdf",
      author: preview.book.author,
      publisher: preview.book.publisher,
      // ... other metadata
    });
    // Show success toast
    // Add to exports list
    // Refresh export history
  } catch (error) {
    // Show error toast
  } finally {
    setIsGeneratingPdf(false);
  }
}

// Upload Front Cover
async function handleFrontCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Validate file type and size
  if (!file.type.startsWith("image/")) {
    addToast("Only image files are allowed", "error");
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    addToast("File must be under 4MB", "error");
    return;
  }
  
  // Check rate limit
  if (coverFrontCount >= 1) {
    addToast("Front cover limit reached (1/1)", "error");
    return;
  }
  
  setIsUploadingCover(true);
  try {
    const uploaded = await uploadBookAsset(slug, file, "cover_image");
    // Update book metadata
    // Refresh preview
    // Increment rate limit counter
    const newCount = coverFrontCount + 1;
    setCoverFrontCount(newCount);
    saveRegenerationCount(slug, { cover_front: newCount });
    addToast("Front cover uploaded successfully", "success");
  } catch (error) {
    addToast("Upload failed", "error");
  } finally {
    setIsUploadingCover(false);
  }
}
```

### Rate Limiting Utility
```typescript
// web/src/lib/regeneration-limiter.ts

const STORAGE_KEY = (slug: string) => `regeneration_count_${slug}`;

interface RegenerationCount {
  rewrite: number;
  cover_front: number;
  cover_back: number;
}

export function getRegenerationCount(slug: string): RegenerationCount {
  if (typeof window === "undefined") {
    return { rewrite: 0, cover_front: 0, cover_back: 0 };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY(slug));
    return stored ? JSON.parse(stored) : { rewrite: 0, cover_front: 0, cover_back: 0 };
  } catch {
    return { rewrite: 0, cover_front: 0, cover_back: 0 };
  }
}

export function saveRegenerationCount(slug: string, count: Partial<RegenerationCount>) {
  if (typeof window === "undefined") return;
  
  const current = getRegenerationCount(slug);
  const updated = { ...current, ...count };
  localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(updated));
}

export function canRegenerate(slug: string, type: "rewrite" | "cover_front" | "cover_back"): boolean {
  const count = getRegenerationCount(slug);
  return count[type] < 1;
}
```

### Service Worker
```javascript
// web/public/preview-service-worker.js

const CACHE_NAME = "preview-tasks-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("sync", (event) => {
  if (event.tag === "book-generation") {
    event.waitUntil(syncBookGeneration());
  }
});

async function syncBookGeneration() {
  // Get tasks from IndexedDB
  // Process each task
  // Send API requests
  // Show notifications when complete
}
```

---

## 📈 SUCCESS METRICS

### Before
- ❌ No PDF/EPUB downloads
- ❌ No manual cover uploads
- ❌ No rate limiting
- ❌ Generation stops when tab closes

### After
- ✅ PDF/EPUB downloads for premium users
- ✅ Manual cover upload (1 front + 1 back)
- ✅ Rate limiting enforced
- ✅ Background processing continues
- ✅ Better UX with loading states
- ✅ Export history display

---

## 🚀 IMPLEMENTATION ORDER

1. **Phase 1: Download Buttons** (Highest Priority)
   - Premium users can download PDF/EPUB
   - Export history display
   - Loading states

2. **Phase 2: Rate Limiting** (High Priority)
   - Create utility
   - Add validation
   - UI feedback

3. **Phase 3: Manual Cover Upload** (Medium Priority)
   - File upload UI
   - Validation
   - Preview refresh

4. **Phase 4: Background Processing** (Lower Priority)
   - Service worker
   - IndexedDB
   - Notifications

---

## 🧪 TESTING CHECKLIST

- [ ] Premium users see download buttons
- [ ] Free users don't see download buttons
- [ ] PDF generation works
- [ ] EPUB generation works
- [ ] Export history displays correctly
- [ ] Front cover upload works
- [ ] Back cover upload works
- [ ] File validation works (type, size)
- [ ] Rate limiting prevents >1 upload
- [ ] Rate limit message displays
- [ ] Background processing continues when tab closes
- [ ] Service worker registers correctly
- [ ] Notifications show when complete

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Rate Limiting Bypass
**Mitigation:** Server-side validation + localStorage backup

### Risk 2: Large File Uploads
**Mitigation:** 4MB limit + client-side validation

### Risk 3: Service Worker Compatibility
**Mitigation:** Feature detection + graceful degradation

### Risk 4: Export Generation Time
**Mitigation:** Loading states + progress indicators

---

**Plan Status:** Ready for Implementation  
**Estimated Time:** 5-8 hours  
**Priority:** High  
**Complexity:** Medium
