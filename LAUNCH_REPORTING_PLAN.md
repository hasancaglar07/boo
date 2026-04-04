# Launch Reporting Plan

Last updated: 2026-04-03
Owner: `launch-strategy`, `analytics-tracking`

## Amaç

Launch sırasında ve launch sonrası ilk 6 haftada aynı üç soruya tutarlı cevap üretmek:

1. Funnel nerede kırılıyor?
2. Hangi mesaj ve yüzey daha iyi dönüştürüyor?
3. Ne zaman iterasyon, ne zaman dağıtım, ne zaman paid açılmalı?

## Ana KPI'lar

Kaynak eşikleri `.agents/product-marketing-context.md` ile hizalıdır.

| KPI | Green | Yellow | Red |
| --- | --- | --- | --- |
| `landing_to_wizard_rate` | `>= 8%` | `5% - 7.9%` | `< 5%` |
| `wizard_start_to_generate_rate` | `>= 35%` | `25% - 34.9%` | `< 25%` |
| `signup_prompt_to_signup_completed` | `>= 45%` | `30% - 44.9%` | `< 30%` |
| `preview_to_checkout_rate` | `>= 8%` | `4% - 7.9%` | `< 4%` |
| `checkout_to_paid_rate` | `>= 35%` | `20% - 34.9%` | `< 20%` |
| `paid_to_export_rate` | `>= 60%` | `40% - 59.9%` | `< 40%` |

## Veri Kaynakları

- Event ingestion: [web/src/app/api/events/route.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/api/events/route.ts)
- Event dictionary: [web/src/lib/analytics.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/lib/analytics.ts)
- Admin analytics UI: [web/src/app/admin/analytics/page.tsx](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/admin/analytics/page.tsx)
- Revenue CSV: [web/src/app/api/admin/reports/revenue/route.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/api/admin/reports/revenue/route.ts)
- Books CSV: [web/src/app/api/admin/reports/books/route.ts](/mnt/c/Users/ihsan/Desktop/BOOK/web/src/app/api/admin/reports/books/route.ts)
- Acceptance criteria: [ANALYTICS_EXPERIMENTS_AND_ACCEPTANCE.md](/mnt/c/Users/ihsan/Desktop/BOOK/ANALYTICS_EXPERIMENTS_AND_ACCEPTANCE.md)

## Report Cadence

### 1. Launch Day Command Center

- Cadence: saatlik
- Süre: launch günü boyunca
- Owner: `launch-strategy`
- Girdi:
  - landing sessions
  - wizard starts
  - generate starts
  - preview views
  - checkout starts
  - checkout completed
  - canlı hata / support sinyali
- Çıktı:
  - saatlik kısa not
  - kırmızı alarm varsa anlık aksiyon

### 2. First 14 Days Daily Report

- Cadence: günde 1 kez
- Owner: `analytics-tracking`
- Girdi:
  - funnel conversion
  - auth failure reasons
  - checkout block reasons
  - export success
  - top landing pages
  - launch source breakdown
- Çıktı:
  - günlük trend
  - en büyük drop-off
  - ertesi gün yapılacak 1 ana iyileştirme

### 3. Weekly Decision Report

- Cadence: haftalık
- Owner: `launch-strategy`
- Girdi:
  - KPI trendleri
  - haftalık experiment sonucu
  - qualitative feedback
  - support ve refund pattern'leri
- Çıktı:
  - keep / fix / kill kararları
  - bir sonraki haftanın backlog'u

## Zorunlu Bölümler

Her rapor aşağıdaki blokları içermeli:

### Snapshot

- Dönem
- Toplam trafik
- Toplam ödeme
- En kritik kazanım
- En kritik risk

### Funnel

- Landing -> Wizard
- Wizard -> Generate
- Generate -> Signup
- Signup -> Preview
- Preview -> Checkout
- Checkout -> Paid
- Paid -> Export

### Diagnostics

- En çok terk edilen adım
- En sık auth hata nedeni
- En sık checkout blok nedeni
- Mobil / desktop farkı

### Aksiyon

- Bug fix
- Copy / CTA testi
- Paywall / auth düzeltmesi
- İçerik / launch asset ihtiyacı

## Launch Day Şablonu

```md
## Launch Day - HH:00

- Traffic:
- Wizard starts:
- Generate starts:
- Preview views:
- Checkout starts:
- Paid:
- Biggest drop:
- Biggest risk:
- Immediate action:
```

## Daily Şablon

```md
## Daily Launch Report - YYYY-MM-DD

- Funnel headline:
- Green metric:
- Red metric:
- Top broken step:
- Top qualitative insight:
- 1 decision for tomorrow:
```

## Weekly Şablon

```md
## Weekly Launch Review - Week N

- What improved:
- What broke:
- Which pages converted:
- Which source brought qualified users:
- Which experiment won:
- What we ship next week:
```

## Karar Kuralları

- `landing_to_wizard_rate` red ise paid açılmaz; önce homepage / CTA düzeltmesi yapılır.
- `signup_prompt_to_signup_completed` red ise auth bridge çözülmeden Product Hunt veya topluluk push'u büyütülmez.
- `checkout_to_paid_rate` red ise pricing ve checkout güven yüzeyi tekrar ele alınır.
- `paid_to_export_rate` red ise launch messaging değil, ürün teslim kalitesi öncelik alır.

## Not

Bu planın amacı dashboard üretmek değil, karar üretmektir. Ölçülemeyen launch anlatısı büyütülmez; rapora dönmeyen metrik launch kararını yönetemez.
