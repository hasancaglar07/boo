# 🚀 Launch Öncesi Skill Analizi ve Geliştirme Planı

**Tarih:** 2026-04-03  
**Amaç:** Canlıya çıkmadan önce kullanılmayan skillerle eksiklikleri tespit etmek ve geliştirme planı oluşturmak

---

## 📊 Mevcut Durum Analizi

### ✅ Kullanılan Skiller (Launch Audit'e göre)
- `launch-strategy` - Launch stratejisi ve audit
- `copywriting` - İçerik ve metin yazarlığı
- `page-cro` - Sayfa dönüşüm optimizasyonu
- `signup-flow-cro` - Kayıt akışı optimizasyonu
- `paywall-upgrade-cro` - Ödeme ekranı optimizasyonu
- `pricing-strategy` - Fiyatlandırma stratejisi
- `analytics-tracking` - Analitik takip

### ❌ Kullanılmayan Skiller (Eksik Analiz)

---

## 🎯 Öncelik Sırasına Göre Skill + Prompt Planları

### 1. SEO Audit (P1 - Kritik)
**Durum:** `todo` - Launch checklist'te P1 olarak işaretlenmiş  
**Neden Gerekli:** Teknik SEO tabanı sağlam değil, arama motoru görünürlüğü risk altında

#### Prompt:
```
seo audit https://yourdomain.com

Lütfen aşağıdaki alanlarda detaylı SEO analizi yap:
1. Teknik SEO (robots.txt, sitemap, meta tags)
2. Core Web Vitals (LCP, INP, CLS)
3. Schema markup durumu
4. Mobile responsiveness
5. Content quality ve E-E-A-T
6. Internal link yapısı
7. Image optimization
8. AI crawler yönetimi (GPTBot, ClaudeBot, etc.)

FULL-AUDIT-REPORT.md ve ACTION-PLAN.md dosyalarını oluştur.
En kritik 5 sorunu ve çözüm önerilerini öncelik sırasına göre listele.
```

**Beklenen Çıktı:**
- `FULL-AUDIT-REPORT.md` - Detaylı SEO bulguları
- `ACTION-PLAN.md` - Önceliklendirilmiş eylem planı
- Skor tablosu ve kategorik analiz

---

### 2. AI SEO (P1 - Kritik)
**Durum:** `todo` - AI SEO backlog'u üretime hazır değil  
**Neden Gerekli:** AI arama motorlarında (ChatGPT, Perplexity, Claude) görünürlük

#### Prompt:
```
ai-seo analyze https://yourdomain.com

Arama motoru optimizasyonu için:
1. LLM citation potansiyelini analiz et
2. llms.txt dosyası var mı ve doğru mu?
3. Structured data ve schema markup kontrolü
4. Content quality ve authority sinyalleri
5. AI crawler robots.txt yönetimi
6. Zero-click search potansiyeli
7. Knowledge panel için sinyaller

AI görünürlük skorunu (0-100) hesapla ve
AI-SEO-IMPROVEMENT-PLAN.md oluştur.
```

**Beklenen Çıktı:**
- AI görünürlük skoru
- Citation potansiyeli analizi
- İyileştirme önerileri

---

### 3. Schema Markup (P1 - Kritik)
**Durum:** `todo` - Schema validation eksik  
**Neden Gerekli:** Rich snippets ve arama sonucu zenginleştirmesi

#### Prompt:
```
seo schema https://yourdomain.com

Schema markup analizi yap:
1. Mevcut JSON-LD schema'ları tespit et
2. Schema.org validasyonunu kontrol et
3. Eksik schema tiplerini belirle
3. Deprecated/restricted schema kullanımı kontrol et
4. FAQPage (restricted) ve HowTo (deprecated) kontrolü
5. Product, Organization, WebSite schema'ları
6. BreadcrumbList schema kontrolü

SCHEMA-ANALYSIS-REPORT.md oluştur ve
her sayfa için gerekli schema önerilerini listele.
```

**Beklenen Çıktı:**
- Mevcut schema envanteri
- Eksik schema önerileri
- Validation raporu

---

### 4. Customer Research (P1 - Önemli)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** Gerçek kullanıcı ihtiyaçlarını anlamak, product-market fit doğrulaması

#### Prompt:
```
customer-research analyze

Book Generator için müşteri araştırması yap:
1. Hedef kitle kimlik analizi (ICP)
2. Jobs to be done (JTBD) framework
3. Pain points ve motivasyonlar
4. Reddit, G2 reviews, forum araştırması
5. Competitor review mining
6. Customer sentiment analizi

CUSTOMER-RESEARCH-REPORT.md oluştur ve:
- 3-5 ana customer persona
- Ana kullanım senaryoları
- Temel motivasyonlar ve itirazlar
- Product-market fit sinyalleri
```

**Beklenen Çıktı:**
- Customer persona kartları
- JTBD analizi
- Pain point haritası
- İyileştirme önerileri

---

### 5. Competitor Analysis (P1 - Önemli)
**Durum:** Kısmen kullanılıyor  
**Neden Gerekli:** Rekabet avantajı ve positioning

#### Prompt:
```
competitor-alternatives analyze

Book Generator için rakip analizi:
1. Direct competitors (ChatGPT, Claude, other AI book tools)
2. Indirect competitors (traditional publishing, ghostwriters)
3. Feature comparison matrix
4. Pricing comparison
5. Strength/weakness analizi
6. Market positioning haritası

COMPETITOR-ANALYSIS-REPORT.md oluştur ve:
- SWOT analizi
- Unique value proposition
- Competitive moat önerileri
```

**Beklenen Çıktı:**
- Rakip karşılaştırma tablosu
- SWOT analizi
- Positioning stratejisi

---

### 6. Content Strategy (P2 - Planlama)
**Durum:** `todo` - Content ve email launch paketi hazır değil  
**Neden Gerekli:** Launch sonrası içerik planlaması ve blog stratejisi

#### Prompt:
```
content-strategy plan

Book Generator için içerik stratejisi oluştur:
1. Blog topic araştırması (SEO odaklı)
2. Content calendar (ilk 3 ay)
3. Topic clusters ve pillar content
4. Lead magnet içerik fikirleri
5. Social media content planı
6. Video content fikirleri

CONTENT-STRATEGY-PLAN.md oluştur ve:
- 50 blog topic başlığı
- 3 aylık yayın takvimi
- Topic cluster haritası
- Lead magnet önerileri
```

**Beklenen Çıktı:**
- İçerik takvimi
- Topic başlıkları
- Lead magnet fikirleri

---

### 7. Email Sequence (P2 - Planlama)
**Durum:** `todo` - Email launch paketi hazır değil  
**Neden Gerekli:** Lead nurturing ve retention

#### Prompt:
```
email-sequence create

Book Generator için email sequence'leri tasarla:
1. Welcome sequence (yeni kayıtlılar için)
2. Onboarding sequence (ilk kitap üretimi için)
3. Re-engagement sequence (inactive users)
4. Post-purchase sequence (premium kullanıcılar)
5. Win-back sequence (churn riski)

EMAIL-SEQUENCE-PLAN.md oluştur ve her sequence için:
- Email sayısı ve timing
- Subject line örnekleri
- Content outline
- CTA stratejisi
```

**Beklenen Çıktı:**
- 5 farklı email sequence
- Subject line örnekleri
- Content outline'lar

---

### 8. A/B Test Setup (P2 - Optimizasyon)
**Durum:** `todo` - İlk A/B test seti hazır değil  
**Neden Gerekli:** Data-driven optimizasyon

#### Prompt:
```
ab-test-setup plan

Book Generator için A/B test stratejisi:
1. Homepage hero section testleri
2. Pricing page CTA testleri
3. Signup flow friction testleri
4. Paywall copy testleri
5. Email subject line testleri

AB-TEST-PLAN.md oluştur ve her test için:
- Hypothesis
- Variants
- Success metrics
- Sample size hesaplaması
- Test duration
```

**Beklenen Çıktı:**
- 5-10 A/B test planı
- Metric tanımları
- Implementation roadmap

---

### 9. Paid Ads Strategy (P2 - Growth)
**Durum:** `todo` - Paid acquisition P0/P1 sonrası  
**Neden Gerekli:** Scale ve growth

#### Prompt:
```
paid-ads strategy

Book Generator için paid ads stratejisi:
1. Google Ads (search, display)
2. Meta Ads (Facebook, Instagram)
3. LinkedIn Ads (B2B targeting)
4. Audience targeting strategy
5. Budget allocation
6. ROAS targets

PAID-ADS-STRATEGY.md oluştur ve:
- Channel mix önerisi
- Budget breakdown
- Target audience tanımları
- Ad creative briefs
```

**Beklenen Çıktı:**
- Channel stratejisi
- Budget planı
- Audience tanımları
- Creative briefs

---

### 10. Churn Prevention (P2 - Retention)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** User retention ve LTV artırımı

#### Prompt:
```
churn-prevention analyze

Book Generator için churn prevention stratejisi:
1. Churn risk sinyalleri
2. Cancellation flow tasarımı
3. Save offer stratejileri
4. Failed payment recovery
5. Win-back campaigns
6. Exit survey tasarımı

CHURN-PREVENTION-PLAN.md oluştur ve:
- Risk sinyal listesi
- Cancellation flow wireframe
- Save offer tier'ları
- Win-back email sequence
```

**Beklenen Çıktı:**
- Churn risk modeli
- Cancellation flow tasarımı
- Save offer stratejisi

---

### 11. Referral Program (P2 - Growth)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** Word-of-mouth ve viral growth

#### Prompt:
```
referral-program design

Book Generator için referral program:
1. Incentive structure (double-sided vs single-sided)
2. Reward tiers
3. Sharing mechanics
4. Tracking ve attribution
5. Fraud prevention

REFERRAL-PROGRAM-DESIGN.md oluştur ve:
- Incentive modeli
- Reward matrisi
- UX flow tasarımı
- Launch planı
```

**Beklenen Çıktı:**
- Referral program tasarımı
- Incentive structure
- Implementation planı

---

### 12. Form CRO (P2 - Optimizasyon)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** Lead capture ve contact form optimizasyonu

#### Prompt:
```
form-cro analyze

Book Generator formlarını analiz et:
1. Contact form
2. Demo request form
3. Lead capture form
4. Form field friction analizi
5. Conversion rate measurement
6. Validation ve error handling

FORM-CRO-REPORT.md oluştur ve her form için:
- Field count vs completion rate
- Friction point analizi
- Optimization önerileri
- A/B test fikirleri
```

**Beklenen Çıktı:**
- Form analizi raporu
- Optimizasyon önerileri
- A/B test fikirleri

---

### 13. Social Content (P2 - Engagement)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** Social media presence ve engagement

#### Prompt:
```
social-content plan

Book Generator için social content stratejisi:
1. LinkedIn content planı
2. Twitter/X thread stratejisi
3. Instagram content ideas
4. Content calendar (4 hafta)
5. Engagement tactics
6. Hashtag strategy

SOCIAL-CONTENT-PLAN.md oluştur ve:
- 30 günlük content takvimi
- Platform-specific content ideas
- Engagement playbook
```

**Beklenen Çıktı:**
- Social content takvimi
- Content fikirleri
- Engagement stratejisi

---

### 14. Site Architecture (P1 - Teknik)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** Site yapısı ve navigasyon optimizasyonu

#### Prompt:
```
site-architecture audit

Book Generator site mimarisini analiz et:
1. URL structure review
2. Navigation hierarchy
3. Internal linking strategy
4. Information architecture
5. Breadcrumb implementation
6. Orphan page detection

SITE-ARCHITECTURE-REPORT.md oluştur ve:
- Current sitemap
- IA sorunları
- Navigation improvements
- Internal link opportunities
```

**Beklenen Çıktı:**
- Site architecture raporu
- Navigation improvements
- IA önerileri

---

### 15. Programmatic SEO (P2 - Scale)
**Durum:** Kullanılmıyor  
**Neden Gerekli:** SEO scale ve topic coverage

#### Prompt:
```
programmatic-seo plan

Book Generator için programmatic SEO:
1. Template page opportunities
2. Location pages (varsa)
3. Comparison pages
4. Integration pages
5. Data-driven page generation
6. Quality gates

PROGRAMMATIC-SEO-PLAN.md oluştur ve:
- 50+ page template ideas
- Implementation roadmap
- Quality control checklist
```

**Beklenen Çıktı:**
- Programmatic SEO planı
- Page template ideas
- Implementation roadmap

---

## 🎯 Önerilen Uygulama Sırası

### Phase 1: Launch Öncesi (P0/P1) - Bu Hafta
1. **SEO Audit** - Teknik SEO tabanı
2. **AI SEO** - AI arama motoru görünürlüğü
3. **Schema Markup** - Rich snippets
4. **Customer Research** - Product-market fit doğrulaması
5. **Competitor Analysis** - Positioning netleştirme

### Phase 2: Launch Haftası (P1) - Gelecek Hafta
6. **Content Strategy** - Blog ve içerik planlaması
7. **Email Sequence** - Lead nurturing hazırlığı
8. **Site Architecture** - Site yapısı optimizasyonu

### Phase 3: Launch Sonrası (P2) - 1. Ay
9. **A/B Test Setup** - Optimizasyon altyapısı
10. **Form CRO** - Lead capture optimizasyonu
11. **Social Content** - Social media stratejisi

### Phase 4: Scale (P2) - 2-3. Ay
12. **Paid Ads** - Growth ve scale
13. **Churn Prevention** - Retention optimizasyonu
14. **Referral Program** - Viral growth
15. **Programmatic SEO** - SEO scale

---

## 📋 Quick Reference: Skill → Prompt Mapping

| Skill | Prompt Template | Output Files | Priority |
|-------|----------------|--------------|----------|
| seo-audit | `seo audit <url>` | FULL-AUDIT-REPORT.md, ACTION-PLAN.md | P1 |
| ai-seo | `ai-seo analyze <url>` | AI-SEO-IMPROVEMENT-PLAN.md | P1 |
| seo-schema | `seo schema <url>` | SCHEMA-ANALYSIS-REPORT.md | P1 |
| customer-research | `customer-research analyze` | CUSTOMER-RESEARCH-REPORT.md | P1 |
| competitor-alternatives | `competitor-alternatives analyze` | COMPETITOR-ANALYSIS-REPORT.md | P1 |
| content-strategy | `content-strategy plan` | CONTENT-STRATEGY-PLAN.md | P2 |
| email-sequence | `email-sequence create` | EMAIL-SEQUENCE-PLAN.md | P2 |
| ab-test-setup | `ab-test-setup plan` | AB-TEST-PLAN.md | P2 |
| paid-ads | `paid-ads strategy` | PAID-ADS-STRATEGY.md | P2 |
| churn-prevention | `churn-prevention analyze` | CHURN-PREVENTION-PLAN.md | P2 |
| referral-program | `referral-program design` | REFERRAL-PROGRAM-DESIGN.md | P2 |
| form-cro | `form-cro analyze` | FORM-CRO-REPORT.md | P2 |
| social-content | `social-content plan` | SOCIAL-CONTENT-PLAN.md | P2 |
| site-architecture | `site-architecture audit` | SITE-ARCHITECTURE-REPORT.md | P1 |
| programmatic-seo | `programmatic-seo plan` | PROGRAMMATIC-SEO-PLAN.md | P2 |

---

## 🚀 Başlangıç Komutları (Copy-Paste Ready)

### 1. SEO Audit (Başla buradan)
```
seo audit https://yourdomain.com
```

### 2. AI SEO
```
ai-seo analyze https://yourdomain.com
```

### 3. Schema Markup
```
seo schema https://yourdomain.com
```

### 4. Customer Research
```
customer-research analyze
```

### 5. Competitor Analysis
```
competitor-alternatives analyze
```

---

## 📝 Notlar

- Her skill çalışması sonrası ilgili `.md` dosyaları otomatik oluşturulur
- Tüm raporlar `c:\Users\ihsan\Desktop\BOOK` dizinine kaydedilir
- Skill çalışmaları sıralı veya paralel çalıştırılabilir
- P0/P1 maddeleri launch öncesi tamamlanmalıdır
- P2 maddeleri launch sonrasına ertelenebilir

---

**Son Güncelleme:** 2026-04-03  
**Status:** Ready for Execution  
**Next Action:** SEO Audit ile başla
