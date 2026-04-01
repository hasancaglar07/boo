# Analytics, Experiments and Acceptance

## Amaç

Bu doküman, yeni funnel’ın nasıl ölçüleceğini, hangi deneylerin yapılacağını ve hangi koşullarda “release hazır” sayılacağını tanımlar.

## Mevcut Analitik Gerçeği

Bugün `web/src/lib/analytics.ts` içinde aşağıdaki event’ler tanımlı:

- `landing_hero_cta_click`
- `pricing_cta_click`
- `start_page_completion`
- `register_completion`
- `wizard_started`
- `wizard_completed`
- `outline_generated`
- `first_chapter_generated`
- `cover_generated`
- `first_export_success`
- `billing_page_opened`
- `checkout_started`
- `checkout_completed`

Yeni funnel için event sözlüğü genişletilecektir.

## Funnel Event Listesi

### Public Funnel Event’leri

| Event | Tetikleyici |
| --- | --- |
| `landing_cta_click` | Hero veya public CTA tıklaması |
| `examples_cta_click` | Examples sayfasından wizard başlangıcı |
| `pricing_cta_click` | Pricing sayfası CTA’sı |
| `faq_cta_click` | SSS sayfası CTA’sı |

### Wizard Event’leri

| Event | Tetikleyici |
| --- | --- |
| `wizard_started` | `/start/topic` ilk yükleme veya ilk input |
| `wizard_topic_completed` | topic adımı başarıyla geçildi |
| `title_ai_used` | başlık AI aksiyonu kullanıldı |
| `subtitle_ai_used` | alt başlık AI aksiyonu kullanıldı |
| `outline_ai_used` | outline AI aksiyonu kullanıldı |
| `outline_manual_edited` | kullanıcı outline üzerinde manuel değişiklik yaptı |
| `style_ai_used` | stil önerisi alındı |
| `wizard_generate_clicked` | generate CTA tıklandı |

### Generate / Signup Event’leri

| Event | Tetikleyici |
| --- | --- |
| `generate_started` | backend generation job oluştu |
| `signup_prompt_shown` | signup bridge görüntülendi |
| `signup_google_clicked` | Google auth tıklandı |
| `signup_magic_link_clicked` | magic link seçildi |
| `signup_completed` | kullanıcı başarıyla account’a bağlandı |
| `draft_merged_to_user` | guest draft başarıyla user hesabına bağlandı |

### Preview / Paywall Event’leri

| Event | Tetikleyici |
| --- | --- |
| `preview_viewed` | preview ekranı açıldı |
| `preview_locked_section_clicked` | kilitli bölüme tıklandı |
| `paywall_viewed` | paywall açıldı |
| `paywall_pdf_clicked` | PDF aksiyonundan paywall açıldı |
| `paywall_epub_clicked` | EPUB aksiyonundan paywall açıldı |
| `paywall_full_unlock_clicked` | tam kitap açma aksiyonundan paywall açıldı |

### Billing Event’leri

| Event | Tetikleyici |
| --- | --- |
| `checkout_started` | Stripe checkout session başladı |
| `checkout_completed` | ödeme başarıyla tamamlandı |
| `checkout_cancelled` | kullanıcı vazgeçti |
| `billing_page_opened` | billing sayfası açıldı |

### Post-Purchase Event’leri

| Event | Tetikleyici |
| --- | --- |
| `full_book_viewed` | premium kullanıcı tam kitabı açtı |
| `pdf_export_started` | PDF export başlatıldı |
| `pdf_export_completed` | PDF export bitti |
| `epub_export_started` | EPUB export başlatıldı |
| `epub_export_completed` | EPUB export bitti |
| `first_export_success` | ilk export başarıyla tamamlandı |

## Core KPI’lar

### Acquisition / Activation

- `landing_to_wizard_rate`
- `wizard_start_to_generate_rate`
- `generate_to_signup_rate`
- `signup_to_preview_rate`

### Monetization

- `preview_to_checkout_rate`
- `checkout_to_paid_rate`
- `paid_to_export_rate`

### Product Health

- ortalama generation süresi
- preview hazırlama süresi
- provider fallback oranı
- generation fail rate
- preview load success rate

## KPI Formülleri

Örnek hesaplar:

- `landing_to_wizard_rate = wizard_started / landing_unique_visitors`
- `generate_to_signup_rate = signup_completed / generate_started`
- `preview_to_checkout_rate = checkout_started / preview_viewed`
- `checkout_to_paid_rate = checkout_completed / checkout_started`

## A/B Test Alanları

### 1. Hero Metni

Test edilecek varyantlar:

- `İlk kitabının önizlemesini dakikalar içinde oluştur`
- `Konunu yaz, AI kitabını oluştursun`
- `Kitap fikrini birkaç adımda kapağa ve içeriğe dönüştür`

Başarı metriği:

- `landing_to_wizard_rate`

### 2. CTA Metni

Varyantlar:

- `Hemen Başla`
- `İlk Kitabını Oluştur`
- `Ücretsiz Önizleme Oluştur`

Başarı metriği:

- CTA click-through rate
- wizard start rate

### 3. Signup Bridge Copy

Varyantlar:

- `Kitabını kaybetme`
- `Sonucu hesabına kaydedelim`
- `Önizleme hazır olduğunda burada seni beklesin`

Başarı metriği:

- `signup_completed / signup_prompt_shown`

### 4. Paywall Başlığı

Varyantlar:

- `Tam kitabı aç`
- `PDF ve tüm bölümleri şimdi aç`
- `Önizlemeyi tam kitaba dönüştür`

Başarı metriği:

- `checkout_started / paywall_viewed`

## Haftalık Kullanıcı Davranış Raporları

Haftalık raporlar şu sorulara cevap vermelidir:

- En çok terk edilen wizard adımı hangisi?
- Hangi AI butonu en çok kullanılıyor?
- Signup bridge’de hangi auth seçeneği daha iyi dönüştürüyor?
- Hangi paywall tetikleyicisi daha yüksek checkout üretiyor?
- Mobil kullanıcılar hangi adımda zorlanıyor?

## Teknik Kabul Kriterleri

- Tüm yeni event’ler standardize payload ile gönderiliyor.
- Event isimleri tutarlı ve tekrar etmiyor.
- `pathname`, `timestamp`, `book_id`, `draft_id` gibi bağlamsal alanlar uygun yerlerde ekleniyor.
- Backend event ingestion bozuk olduğunda kullanıcı akışı etkilenmiyor.

## UX Kabul Kriterleri

- Her adımda ana CTA görünür.
- Kullanıcı ilk 1 dakika içinde generate aşamasına gelebilir.
- Signup bridge aldatıcı değil, anlaşılırdır.
- Preview ekranı ürün değerini net gösterir.
- Paywall sert ama mantıksız değildir.

## Security Kabul Kriterleri

- Free kullanıcıya full manuscript network response’unda dönmez.
- Export endpoint premium guard ile korunur.
- Guest draft başka kullanıcıya sızmaz.
- Guest token güvenli saklanır.
- Preview response yalnız izinli kırpılmış içeriği taşır.

## Funnel Release Checklist

### Ürün Akışı

- ziyaretçi landing’den wizard’a geçebiliyor
- wizard adımları veri kaybetmiyor
- generate sonrası signup bridge açılıyor
- signup sonrası preview açılıyor
- free kullanıcı paywall görüyor
- premium kullanıcı export alıyor

### Ölçümleme

- ana event’ler veri katmanına düşüyor
- checkout event zinciri çalışıyor
- preview ve paywall event’leri eksiksiz

### Performans

- landing hızlı açılıyor
- wizard geçişleri hissedilir derecede hızlı
- preview makul sürede yükleniyor

## İlk Release İçin Hedef Değerler

Bu değerler başlangıç benchmark’ı olarak kullanılacaktır:

- `landing_to_wizard_rate` için başlangıç hedefi: `%8+`
- `wizard_start_to_generate_rate` için başlangıç hedefi: `%35+`
- `signup_prompt_to_signup_completed` için başlangıç hedefi: `%45+`
- `preview_to_checkout_rate` için başlangıç hedefi: `%8+`
- `checkout_to_paid_rate` için başlangıç hedefi: `%35+`

Not:

- Bunlar nihai başarı eşiği değil, ilk validasyon hedefidir.

## Uygulama Referansları

Yeni event’ler şu mevcut yapıya eklenmelidir:

- `web/src/lib/analytics.ts`
- wizard ve preview bileşenleri
- checkout ve billing akışı
- backend event ingestion endpoint’i

## Son Karar

Yeni funnel yalnızca tasarlanmayacak, ölçülecek. Ölçülemeyen hiçbir geçiş “iyi hissettiriyor” diye kabul edilmeyecek.

Karar standardı nettir:

- event var mı,
- dönüşüm var mı,
- sızıntı var mı,
- kullanıcı anlıyor mu.
