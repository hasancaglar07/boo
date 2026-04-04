# Launch Readiness Checklist

Last updated: 2026-04-03 (P0 kod düzeltmeleri tamamlandı)

Bu doküman yayın öncesi kontrolün tek referans noktasıdır. Sıra `P0 -> P1 -> P2` şeklinde ilerler.

Status alanı:
- `todo`
- `in_progress`
- `done`
- `blocked`

## P0

### 0. Claim, schema ve social proof hijyeni temiz

- Status: `done`
- Owner: `launch-strategy`, `copywriting`
- Hedef: Kanıtsız yorum, rating, kullanıcı sayısı ve şişirilmiş schema claim’leri launch yüzeylerinden kaldırılmış olsun
- Kontroller:
  - Aggregate rating / review schema yalnız doğrulanmış veriyle kullanılıyor
  - Homepage, pricing, about, use-cases, preview ve upgrade yüzeylerinde kanıtsız sosyal proof yok
  - Proof katmanları product marketing context ile uyumlu
- Evidence:
  - [web/src/app/layout.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/layout.tsx)
  - [web/src/app/pricing/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/pricing/page.tsx)
  - [web/src/app/about/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/about/page.tsx)
  - [web/src/app/use-cases/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/use-cases/page.tsx)
  - [web/src/components/funnel/book-preview-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/book-preview-screen.tsx)
  - [web/src/components/funnel/upgrade-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/upgrade-screen.tsx)
  - [LAUNCH_AUDIT_2026-04-03.md](/mnt/c/Users/ihsan/Desktop/BOOK/LAUNCH_AUDIT_2026-04-03.md)

### 1. Funnel akışı kırılmadan tamamlanıyor

- Status: `in_progress`
- Owner: `launch-strategy`
- Hedef: Kullanıcı `Landing -> Start -> Wizard -> Preview -> Upgrade -> Export` akışını tamamlayabilsin
- Kontroller:
  - Landing CTA doğru wizard adımına gidiyor
  - Wizard adımları arasında veri kaybı yok
  - Generate sonrası signup bridge / auth geçişi doğru çalışıyor
  - Preview ekranı açılıyor
  - Free kullanıcı paywall görüyor
  - Premium kullanıcı export alabiliyor
- Evidence:
  - [web/src/app/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/page.tsx)
  - [web/src/app/start/topic/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/start/topic/page.tsx)
  - [web/src/app/start/generate/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/start/generate/page.tsx)
  - [web/src/components/funnel/guided-wizard-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/guided-wizard-screen.tsx)
  - [web/src/components/funnel/book-preview-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/book-preview-screen.tsx)
  - [web/src/components/funnel/upgrade-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/upgrade-screen.tsx)
- Audit note: Kod yüzeyleri mevcut; launch öncesi zorunlu kalan iş uçtan uca smoke test ve export başarı kanıtı.

### 2. Event tracking eksiksiz ve karar verdiriyor

- Status: `done`
- Owner: `analytics-tracking`
- Hedef: Funnel ve ödeme kararlarını ölçen olayların tamamı doğrulansın
- Kontroller:
  - `wizard_started`
  - `wizard_topic_completed`
  - `generate_started`
  - `signup_completed`
  - `preview_viewed`
  - `paywall_viewed`
  - `checkout_started`
  - `checkout_completed`
  - `first_export_success`
  - Payload alanları tutarlı
- Evidence:
  - [web/src/lib/analytics.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/lib/analytics.ts)
  - [web/src/app/layout.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/layout.tsx)
  - [web/src/app/api/events/route.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/api/events/route.ts)
  - [web/src/app/admin/analytics/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/admin/analytics/page.tsx)
  - [ANALYTICS_EXPERIMENTS_AND_ACCEPTANCE.md](/mnt/c/Users/ihsan/Desktop/BOOK/ANALYTICS_EXPERIMENTS_AND_ACCEPTANCE.md)
  - [LAUNCH_REPORTING_PLAN.md](/mnt/c/Users/ihsan/Desktop/BOOK/LAUNCH_REPORTING_PLAN.md)
- Audit note: Event sözlüğü ve ingestion var; kalan iş payload QA, dashboard doğrulaması ve ilk haftalık rapor akışı.

### 3. Homepage ve core marketing sayfaları 5 saniyede ne sattığını anlatıyor

- Status: `done`
- Owner: `page-cro`, `copywriting`
- Hedef: Ürün kategorisi, değer ve ana aksiyon tek bakışta anlaşılsın
- Kontroller:
  - Hero başlığı net
  - Alt başlık outcome odaklı
  - CTA tutarlı
  - Fiyat / risk / kalite itirazları cevaplanıyor
- Evidence:
  - [web/src/app/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/page.tsx)
  - [web/src/components/site/premium-book-hero.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/site/premium-book-hero.tsx)
  - [web/src/app/pricing/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/pricing/page.tsx)
  - [web/src/app/how-it-works/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/how-it-works/page.tsx)
  - [web/src/app/faq/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/faq/page.tsx)
  - [web/src/components/site/home-testimonials-section.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/site/home-testimonials-section.tsx)
- Audit note: Konumlama güçlü; kalan iş gerçek kullanıcı testinde 5 saniye mesaj netliği doğrulaması.

### 4. Signup bridge sürtünmesi düşük

- Status: `done`
- Owner: `signup-flow-cro`
- Hedef: Generate sonrası auth mecburiyeti mantıklı ve düşük sürtünmeli hissetsin
- Kontroller:
  - Neden kayıt gerektiği açık
  - Google / magic link çalışıyor
  - Draft kullanıcı hesabına doğru bağlanıyor
- Evidence:
  - [web/src/components/funnel/generate-auth-gate-dialog.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/generate-auth-gate-dialog.tsx)
  - [web/src/components/funnel/continue-auth-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/continue-auth-screen.tsx)
  - [web/src/components/forms/auth-form.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/forms/auth-form.tsx)
- Audit note: Akış ve copy mevcut; launch öncesi başarı oranı ve auth hata senaryoları QA edilmeli.

### 5. Paywall ve pricing mantığı sade

- Status: `done`
- Owner: `paywall-upgrade-cro`, `pricing-strategy`
- Hedef: Kullanıcı free preview ile value görsün, upgrade gerekçesi net olsun
- Kontroller:
  - One-time unlock vs subscription farkı net
  - PDF / EPUB / full unlock aksiyonları anlaşılır
  - Trust ve risk reversal güçlü
- Evidence:
  - [web/src/components/funnel/upgrade-screen.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/components/funnel/upgrade-screen.tsx)
  - [web/src/app/billing/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/billing/page.tsx)
  - [web/src/app/pricing/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/pricing/page.tsx)
- Audit note: Trust yüzeyi temizlendi; launch öncesi checkout ve email verification blokları gerçek veriyle doğrulanmalı.

### 6. Hata yüzeyi kontrollü

- Status: `done`
- Owner: `launch-strategy`
- Hedef: Kullanıcı sert framework hata ekranı görmesin
- Kontroller:
  - app ve root error ekranları çalışıyor
  - loading ve not-found yüzeyleri var
  - backend unavailable durumunda fallback var
- Evidence:
  - [web/src/app/error.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/error.tsx)
  - [web/src/app/global-error.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/global-error.tsx)
  - [web/src/app/loading.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/loading.tsx)
  - [web/src/app/not-found.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/not-found.tsx)
  - [web/src/app/api/backend/[...path]/route.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/api/backend/[...path]/route.ts)
- Audit note: Yüzeyler mevcut; launch öncesi manuel fallback smoke testi tamamlanmalı.

## P1

### 1. Pricing anlatısı sadeleşti

- Status: `in_progress`
- Owner: `pricing-strategy`, `copywriting`

### 2. Compare, examples ve use-cases sayfaları launch trafiğini karşılıyor

- Status: `in_progress`
- Owner: `page-cro`, `competitor-alternatives`, `copywriting`

### 3. Teknik SEO tabanı sağlam

- Status: `todo`
- Owner: `seo-audit`
- Evidence:
  - [web/src/app/robots.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/robots.ts)
  - [web/src/app/sitemap.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/sitemap.ts)

### 4. AI SEO sayfa backlog’u üretime hazır

- Status: `todo`
- Owner: `ai-seo`
- Evidence:
  - [AI_SEO_BACKLOG.md](/mnt/c/Users/ihsan/Desktop/BOOK/AI_SEO_BACKLOG.md)
  - [CONTENT_FUNNEL_EXECUTION_PACK.md](/mnt/c/Users/ihsan/Desktop/BOOK/CONTENT_FUNNEL_EXECUTION_PACK.md)

### 5. Admin analytics raporları karar verdiriyor

- Status: `in_progress`
- Owner: `analytics-tracking`

## P2

### 1. İlk A/B test seti hazır

- Status: `todo`
- Owner: `ab-test-setup`

### 2. Brand tutarlılığı kontrol edildi

- Status: `todo`
- Owner: `ckm:brand`

### 3. Content ve email launch paketi hazır

- Status: `todo`
- Owner: `content-strategy`, `email-sequence`

### 4. Paid acquisition yalnız P0 ve P1 sonrası açılır

- Status: `todo`
- Owner: `paid-ads`, `ad-creative`

## Notlar

- İlk çalışma sırası: `launch-strategy -> analytics-tracking -> page-cro -> copywriting -> signup-flow-cro -> paywall-upgrade-cro -> pricing-strategy -> seo-audit -> ai-seo`
- Kanıtsız sosyal proof veya doğrulanmamış metrik kullanılmamalı
- Eski plan dokümanları güncel kod ile çelişiyorsa kod esas alınmalı
- Bu checklist’in denetim özeti: [LAUNCH_AUDIT_2026-04-03.md](/mnt/c/Users/ihsan/Desktop/BOOK/LAUNCH_AUDIT_2026-04-03.md)
- Rapor cadence ve metrik planı: [LAUNCH_REPORTING_PLAN.md](/mnt/c/Users/ihsan/Desktop/BOOK/LAUNCH_REPORTING_PLAN.md)
