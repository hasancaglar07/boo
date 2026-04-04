# Book Generator Wireframe-Level Marketing Plan

Son güncelleme: 2026-04-02

Bu doküman, Book Generator'ın public funnel sayfaları için section-by-section wireframe planını tanımlar.

Her sayfada:
- bölüm sırası
- her bölümün amacı
- önerilen mesaj yönü
- psikoloji modeli
- proof kullanımı
- CTA mantığı

Amaç:
- tasarım, copy ve geliştirme ekiplerinin aynı sayfa yapısında hizalanması

---

## Global Wireframe Rules

Her marketing sayfasında ideal akış:

1. `Clarity`
   Kullanıcı ilk 3-5 saniyede ürünün ne yaptığını anlamalı
2. `Friction reduction`
   Kullanıcı neden zorlanmayacağını görmeli
3. `Proof`
   Kullanıcı neden güvenmesi gerektiğini görmeli
4. `Fit`
   Kullanıcı bunun kendisine uygun olup olmadığını anlamalı
5. `Risk reversal`
   Kullanıcı önce görebileceğini, sonra karar vereceğini bilmeli
6. `CTA`
   Kullanıcı tek net aksiyona yönlendirilmeli

Sabit proof dili:
- Önce preview gör
- Kayıt olmadan başla
- Kredi kartı gerekmez
- Tek akış: brief → outline → chapter → cover → export
- KDP uyumlu çıktı mantığı

Sabit CTA dili:
- Başlat
- Gör
- Dene
- Aç
- Devam Et

---

## 1. Home Wireframe

Sayfa:
- `web/src/app/page.tsx`

### Section 1: Hero

Amaç:
- ürünün ne olduğunu ve en büyük faydasını anında anlatmak

Mesaj:
- "Uzmanlığını kısa sürede görülebilir bir kitaba çevir."
- "Konunu yaz, wizard seni yönlendirsin."

Psikoloji:
- Activation Energy
- Present Bias

Bileşenler:
- başlık
- alt başlık
- ana CTA
- destek CTA
- micro proof bar

Proof:
- kayıt olmadan başla
- kredi kartı gerekmez
- önce preview gör

CTA:
- `Ücretsiz Preview Başlat`
- `Örnek Kitapları Gör`

### Section 2: One-Sentence Value Block

Amaç:
- "Book Generator ne yapar?" sorusunu çok erken kapatmak

Mesaj:
- "Tek bir fikirden çok dilli, branded ve yayına hazır non-fiction kitap üretmeni sağlayan publishing studio."

Psikoloji:
- Hick's Law reduction

### Section 3: Problem Reframe

Amaç:
- kullanıcının asıl probleminin yazmak değil, dağınık süreç olduğunu göstermek

Mesaj blokları:
- boş sayfa korkusu
- araçlar arası dağılma
- export karmaşası

Psikoloji:
- Loss Aversion

CTA:
- küçük inline CTA:
  `Tek Akışı Gör`

### Section 4: How It Works Snapshot

Amaç:
- ürünün karmaşık olmadığını göstermek

Yapı:
- 3 kart veya 4 kısa adım

Mesaj:
- konu
- outline
- preview
- export

Psikoloji:
- BJ Fogg
- Goal-Gradient

CTA:
- `3 Adımı Gör`

### Section 5: Visual Proof / Examples

Amaç:
- vaat yerine çıktı göstermek

Yapı:
- gerçek örnek kitaplar
- kapak + outline + export badge

Psikoloji:
- Social Proof
- Endowment Effect

CTA:
- `Buna Benzer Kitap Başlat`

### Section 6: Price Anchor

Amaç:
- fiyat şokunu önceden yönetmek

Mesaj:
- "İlk kitabın için $4. Ghostwriter için binlerce dolar."

Psikoloji:
- Anchoring

CTA:
- `Tek Kitapla Başla`

### Section 7: Testimonials

Amaç:
- insanlar bunu gerçekten kullanıyor hissi vermek

Mesaj yönü:
- ilk kez kitap çıkarma
- hız
- authority
- KDP

Psikoloji:
- Bandwagon Effect
- Availability Heuristic

### Section 8: Product Depth

Amaç:
- ürünün sadece güzel landing değil, gerçek çalışma alanı olduğunu göstermek

Yapı:
- workspace
- research
- metadata
- export

Psikoloji:
- Authority

### Section 9: FAQ Lite

Amaç:
- büyük itirazları sayfa terk etmeden çözmek

Sorular:
- kalite
- ücretsiz preview
- KDP
- haklar

Psikoloji:
- Regret Aversion

### Section 10: Final CTA

Amaç:
- tek net kapanış

Mesaj:
- "Uzmanlığın kitap olacak. Bu hafta."

CTA:
- `Ücretsiz Preview Başlat`

---

## 2. Pricing Wireframe

Sayfa:
- `web/src/app/pricing/page.tsx`

### Section 1: Pricing Hero

Amaç:
- fiyatı korkutucu değil, rasyonel göstermek

Mesaj:
- "Ghostwriter yerine bu hafta kitabın elinde olsun."

Psikoloji:
- Anchoring
- Mental Accounting

CTA:
- `Tek Kitapla Başla`

### Section 2: Trust Strip

Amaç:
- fiyat öncesi güven inşa etmek

Proof:
- KDP uyumlu
- iade
- önce dene
- iptal kolay

Psikoloji:
- Regret Aversion

### Section 3: Guarantee Block

Amaç:
- riski minimum hissettirmek

Mesaj:
- "30 gün iade. Hiçbir şey risk altında değil."

### Section 4: Plan Cards

Amaç:
- kullanıcıyı en uygun plana yönlendirmek

Plan sırası:
- Tek Kitap
- Starter
- Creator
- Studio

Kurgu:
- Creator görsel ve copy olarak önerilen plan

Psikoloji:
- Decoy Effect
- Default Effect

CTA:
- Tek Kitap: `Bu Kitabı $4 ile Aç`
- Creator: `En Mantıklı Plan: Yazar`

### Section 5: Competitor Cost Comparison

Amaç:
- fiyatı başka seçeneklerle kıyaslayınca ucuz göstermek

Mesaj:
- ajans
- ghostwriter
- manuel araç zinciri

### Section 6: KDP / Delivery Proof

Amaç:
- paranın karşılığının yayın çıktısı olduğunu göstermek

Proof:
- canlı KDP örneği
- EPUB/PDF
- preview süresi

### Section 7: Comparison Table

Amaç:
- karar yorgunluğunu düşürmek

### Section 8: Pricing FAQ

Amaç:
- ödeme, iade, upgrade, haklar sorularını kapatmak

### Section 9: Final CTA

CTA:
- `Preview Gör, Sonra Karar Ver`

---

## 3. Compare Wireframe

Sayfa:
- `web/src/app/compare/page.tsx`

### Section 1: Hero

Mesaj:
- "ChatGPT ile başlayabilirsin. Bitirmek için yetmeyebilir."

Psikoloji:
- Contrast Effect

### Section 2: Short Answer Box

Amaç:
- ürün kategorisini netleştirmek

### Section 3: Feature Table

Amaç:
- yapısal farkı göstermek

### Section 4: Hidden Cost Block

Amaç:
- manuel yolun gizli maliyetini göstermek

Mesaj:
- tekrar prompt yazma
- bağlam kaybı
- kapak/export dağınıklığı

Psikoloji:
- Opportunity Cost

### Section 5: Alternative Cards

Amaç:
- diğer çözümleri adil ama net biçimde konumlamak

### Section 6: Final CTA

CTA:
- `Kendi Konunla Farkı Gör`

---

## 4. How It Works Wireframe

Sayfa:
- `web/src/app/how-it-works/page.tsx`

### Section 1: Hero

Mesaj:
- "Boş sayfadan değil, yönlendirilmiş bir preview'dan başlarsın."

### Section 2: Step Grid

Amaç:
- süreçteki belirsizliği yok etmek

Her kart:
- adım
- sonuç
- bir sonraki aşama

### Section 3: Workflow Detail

Amaç:
- sistemin sadece yüzey değil, mantık taşıdığını göstermek

### Section 4: Deliverables

Amaç:
- sonunda elde edilen somut çıktıların görünmesi

### Section 5: Final CTA

CTA:
- `3 Adımı Şimdi Dene`

---

## 5. Use Cases Wireframe

Sayfa:
- `web/src/app/use-cases/page.tsx`

### Section 1: Hero

Mesaj:
- "Herkes için değil. Doğru kullanıcı için çok güçlü."

### Section 2: Segment Cards

Amaç:
- kullanıcıya kendini buldurmak

Her segmentte:
- kim
- neden şimdi
- hangi çıktı
- kısa quote
- segment CTA

### Section 3: Final CTA

CTA:
- `Bana En Yakın Senaryoyla Başla`

---

## 6. Examples Wireframe

Sayfa:
- `web/src/app/examples/page.tsx`

### Section 1: Hero

Mesaj:
- "Vaat değil, görülebilir kitap."

### Section 2: Example Grid

Amaç:
- gerçek kaliteyi göstermek

Her örnek:
- kapak
- positioning
- outline görünümü
- export rozetleri

### Section 3: Interactive Preview

Amaç:
- kullanıcıya sahiplenme duygusu vermek

CTA:
- `Buna Benzer Kitap Başlat`

### Section 4: Final CTA

CTA:
- `Kendi Preview'ını Gör`

---

## 7. FAQ Wireframe

Sayfa:
- `web/src/app/faq/page.tsx`

### Section 1: Hero

Mesaj:
- "Kararı geciktiren soruların kısa cevapları."

### Section 2: Most Important Questions

Amaç:
- üst düzey 5-7 itirazı çözmek

### Section 3: Detailed FAQ by Category

Amaç:
- derin soruları kategori bazlı çözmek

### Section 4: Who It Is Not For

Amaç:
- güven artırmak

### Section 5: Final CTA

CTA:
- `Soruların Temizse Preview'ı Başlat`

---

## 8. Resources Wireframe

Sayfa:
- `web/src/app/resources/page.tsx`

### Section 1: Hero

Mesaj:
- "Kitabını daha hızlı çıkarman için ücretsiz karar araçları."

### Section 2: Featured Resource

Amaç:
- en yüksek intent aracı öne çıkarmak

### Section 3: Resource Grid

Kategori:
- validator
- checklist
- templates
- KDP toolkit

### Section 4: Bridge to Product

Amaç:
- kaynak tüketimini ürün denemesine bağlamak

CTA:
- `Kaynak Yeterliyse Şimdi Kitabı Başlat`

---

## 9. Blog Wireframe

Sayfa:
- `web/src/app/blog/page.tsx`

### Section 1: Hero

Mesaj:
- "Karar hızlandıran içerikler."

### Section 2: Topic Categories

Amaç:
- içerik haritasını net göstermek

### Section 3: Featured Article

Amaç:
- en büyük itirazı hedefleyen yazıyı öne çıkarmak

### Section 4: Remaining Articles Grid

Amaç:
- tüm karar aşamalarını kapsamak

### Section 5: Final CTA

CTA:
- `Okumayı Bırakıp Kendi Konunla Dene`

---

## 10. About Wireframe

Sayfa:
- `web/src/app/about/page.tsx`

### Section 1: Hero

Mesaj:
- "Daha fazla özellik değil, daha fazla biten kitap."

### Section 2: Product Principles

Amaç:
- tasarım felsefesini anlatmak

### Section 3: Why We Built It This Way

Amaç:
- ürün kararlarının kullanıcı psikolojisine dayandığını göstermek

### Section 4: Mission / Approach

Amaç:
- marka karakterini netleştirmek

### Section 5: Final CTA

CTA:
- `Bu Yaklaşımı Üründe Gör`

---

## 11. Contact Wireframe

Sayfa:
- `web/src/app/contact/page.tsx`

### Section 1: Hero

Mesaj:
- "Kısa sorular için hızlı cevap."

### Section 2: Contact Form

Amaç:
- sürtünmesiz iletişim

### Section 3: Contact Reasons

Örnek:
- ekip kullanımı
- plan yardımı
- KDP akışı

### Section 4: Soft Trust Copy

Mesaj:
- gereksiz satış dili yok
- kısa ve net destek

---

## 12. Start Wireframe

Sayfa:
- `web/src/app/start/page.tsx`

### Section 1: Hero

Mesaj:
- "Fikrinden ilk preview'a tek başlangıç."

### Section 2: Option Cards

Kartlar:
- wizard
- examples
- pricing

Kurgu:
- wizard kartı önerilen başlangıç

### Section 3: Trust Strip

Proof:
- ücretsiz preview
- kredi kartı gerekmez
- kayıt şartsız

### Section 4: Secondary Link

CTA:
- `Adım Adım Gör`

---

## 13. Signup Wireframe

Sayfa:
- `web/src/app/signup/page.tsx`

### Section 1: Logo + Orientation

Amaç:
- güvenli giriş hissi

### Section 2: Value Header

Mesaj:
- "Preview'ını kaydet ve kaldığın yerden devam et"

### Section 3: Auth Form

Amaç:
- en az sürtünmeyle tamamlatmak

### Section 4: Trust Line

Mesaj:
- ödeme istemez
- preview hesabına bağlanır

---

## 14. Login Wireframe

Sayfa:
- `web/src/app/login/page.tsx`

### Section 1: Logo

### Section 2: Header

Mesaj:
- "Kitabın kaldığı yerden devam etsin"

### Section 3: Auth Form

---

## 15. Refund Policy Wireframe

Sayfa:
- `web/src/app/refund-policy/page.tsx`

### Section 1: Hero

Mesaj:
- "Risk almadan denemen için açık iade politikası."

### Section 2: Policy Summary Cards

Amaç:
- karmaşık yasal dili sadeleştirmek

### Section 3: Explicit Conditions

Amaç:
- pricing ile tam uyum

Not:
- burada muğlaklık kalmamalı

---

## 16. Privacy Wireframe

Sayfa:
- `web/src/app/privacy/page.tsx`

### Section 1: Hero

Amaç:
- veri güvenliğini sade dille açıklamak

### Section 2: Data Categories

### Section 3: User-Control Summary

Amaç:
- kullanıcı içeriğinin kontrolünün kimde olduğunu netleştirmek

---

## 17. Terms Wireframe

Sayfa:
- `web/src/app/terms/page.tsx`

### Section 1: Hero

### Section 2: Summary Cards

Amaç:
- hizmet kapsamı
- kullanıcı sorumluluğu
- plan limitleri

---

## 18. Book Idea Validator Wireframe

Sayfa:
- `web/src/app/tools/book-idea-validator/page.tsx`

### Section 1: Hero

Mesaj:
- "Kitap fikrin güçlü mü, yalnızca kulağa hoş mu geliyor?"

### Section 2: Sample Prompt Chips

Amaç:
- boş form korkusunu kaldırmak

### Section 3: Input Form

Amaç:
- kullanıcıya kendi fikrine yatırım yaptırmak

### Section 4: Partial Score / Analysis

Amaç:
- ilk değer anında görünmeli

### Section 5: Email Gate

Amaç:
- tam rapor için makul değer değişimi

### Section 6: Product Bridge

Mesaj:
- "Validator karar netliği verir, asıl üretim wizard'da başlar"

CTA:
- `Bu Fikirle Preview Başlat`

---

## 19. Wizard Wireframe

Yüzey:
- `web/src/components/funnel/guided-wizard-screen.tsx`

### Global Wizard Shell

Olması gereken sabit öğeler:
- step indicator
- next reward text
- düşük sürtünmeli CTA

### Topic Step

Amaç:
- konu, okur, yön

Micro copy:
- "Bu adım sonunda kitap yönünü göreceksin"

CTA:
- `Başlık Önerilerine Geç`

### Title Step

Amaç:
- title / subtitle netliği

CTA:
- `Bölüm Planını Oluştur`

### Outline Step

Amaç:
- omurga kurmak

CTA:
- `Stil ve Kapak Yönünü Seç`

### Style Step

Amaç:
- ton, dil, kapak yönü

CTA:
- `Preview'ı Hazırla`

### Generate Step

Amaç:
- beklerken güven kaybetmemek

Mesaj:
- "Preview hazırlanıyor"
- "Başlık, outline ve ilk içerik oluşturuluyor"

---

## 20. Auth Gate Wireframe

Yüzey:
- `web/src/components/funnel/generate-auth-gate-dialog.tsx`

### Left Panel

Amaç:
- neden hesap gerektiğini açıklamak

Mesaj:
- "Hazırlanan kitabı hesabına kaydedelim"

### Right Panel

Amaç:
- hızlı auth tamamlatmak

Trust chips:
- ödeme istemiyoruz
- preview hesabına yazılır
- sonra kaldığın yerden devam edersin

CTA:
- `Hesap Oluştur ve Preview'ı Hazırla`

---

## 21. Upgrade Screen Wireframe

Yüzey:
- `web/src/components/funnel/upgrade-screen.tsx`

### Section 1: Sticky Book Mockup

Amaç:
- sahiplenme duygusu

### Section 2: Hero Value

Mesaj:
- "Kitabın hazır. Şimdi tamamını aç."

### Section 3: What You Get

Amaç:
- unlock sonrası değeri net göstermek

### Section 4: Trust Proof

Proof:
- anında erişim
- iade
- KDP uyumu
- abonelik zorunlu değil

### Section 5: Plan Comparison

Amaç:
- tek kitap unlock vs aylık plan

### Section 6: Final Payment CTA

CTA:
- `$4 ile Tam Kitabı Aç`

---

## 22. Prioritized Build Order

İlk uygulanacak wireframe'ler:
1. Home
2. Pricing
3. Start
4. Wizard
5. Upgrade

İkinci dalga:
1. Compare
2. Examples
3. FAQ
4. Use Cases
5. Signup / Login

Üçüncü dalga:
1. Resources
2. Blog
3. About
4. Contact
5. Refund / Privacy / Terms

---

## 23. Final Direction

Site genelinde ana his şu olmalı:

- ürün seni düşünmeye değil ilerlemeye iter
- önce gösterir, sonra satar
- araç değil akış satar
- kitabı yazdırma vaadi değil, kitabı bitirme vaadi öne çıkar

