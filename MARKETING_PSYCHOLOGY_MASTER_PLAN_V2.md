# Book Generator Marketing Psychology Master Plan V2

Son güncelleme: 2026-04-02

Bu doküman, Book Generator'ın tüm public funnel sayfaları için gelişmiş mesaj mimarisini, psikoloji modellerini, sayfa hedeflerini, önerilen copy yönünü, CTA sistemini, test hipotezlerini ve KPI planını tanımlar.

Bu versiyon, önceki özetten daha detaylıdır.

Kapsam:
- Ana sayfa
- Pricing
- Compare
- How It Works
- Use Cases
- Examples
- FAQ
- Resources
- Blog
- About
- Contact
- Start
- Signup
- Login
- Refund Policy
- Privacy
- Terms
- Book Idea Validator
- Wizard akışı
- Auth gate
- Upgrade screen

---

## 1. Executive Diagnosis

### Temel gerçek

Book Generator bir "AI ile kitap yazma aracı" olarak değil, şu problemi çözen bir davranış sistemi olarak konumlanmalı:

- kullanıcı başlamakta zorlanıyor
- kullanıcı yanlış para harcamaktan korkuyor
- kullanıcı dağınık araçlar arasında kayboluyor
- kullanıcı kalitenin yeterli olup olmayacağını bilmiyor
- kullanıcı kitabı bitirebileceğine inanmıyor

Bu yüzden asıl rakip:
- ChatGPT
- Jasper
- Scrivener
- ajanslar
- ghostwriter'lar

değil; aynı zamanda:
- erteleme
- belirsizlik
- sürtünme
- karar yorgunluğu
- risk algısı

### Funnel'ın psikoloji omurgası

Tüm sayfalarda tekrar eden ana modeller:

- `Activation Energy`
  Kullanıcının ilk adımı atmasını kolaylaştır
- `Goal-Gradient Effect`
  Küçük ilerlemeyi görünür yap
- `Loss Aversion`
  Ertelemenin ve dağınık yolun maliyetini göster
- `Regret Aversion`
  "Önce preview, sonra ödeme" ile riski düşür
- `Social Proof`
  Görülebilir ve sayısal kanıt ver
- `Anchoring`
  Ghostwriter, ajans, zaman maliyeti ve token maliyetiyle kıyasla
- `Endowment Effect`
  Kullanıcıya preview üzerinden "bu benim kitabım" hissi ver
- `Commitment & Consistency`
  Küçük adım attır, sonra derinleştir

### Şu an güçlü olanlar

- Ürünün "boş sayfa korkusunu kaldırma" vaadi güçlü
- Fiyat kontrastı iyi
- Preview ve $4 unlock mesajı iyi
- KDP proof yüzeyi var
- SSS ve compare sayfaları doğru itirazları hedefliyor

### Şu an zayıf olanlar

- Proof mesajı dağınık ve yeterince sistematik değil
- `2 kitap KDP'de canlı` güçlü ama artık küçük kalıyor
- Start ve wizard tarafında `goal-gradient` daha görünür olabilir
- Refund messaging ile refund-policy sayfası tam hizalı değil
- Bazı sayfalarda CTA mimarisi hâlâ eşit ağırlıklı
- Social proof rakamsal olarak daha büyük bir hikâyeye bağlanmıyor

---

## 2. Proof Architecture

### Kullanılacak proof katmanları

Book Generator için proof tek seviyeli olmamalı.

Katmanlar:

1. `Operational proof`
- Tek akış: brief → outline → chapter → cover → export

2. `Outcome proof`
- KDP'ye yüklenebilir EPUB/PDF
- gerçek preview
- gerçek export

3. `Market proof`
- Amazon KDP'de yayınlanmış kitaplar
- örnek showcase kitaplar

4. `Scale proof`
- kullanıcı tarafından sağlanan bilgiye göre `4.719 Amazon KDP kitabı`

5. `Trust proof`
- iade garantisi
- kredi kartı olmadan preview
- kayıtsız başlangıç

### 4.719 KDP kitabı nasıl kullanılmalı?

Bu veri çok güçlü. Ama yanlış kullanılırsa güveni zedeler.

Öneri:
- Eğer bu sayı doğrulanmış ve savunulabilir ise ana proof mimarisine alınmalı
- Eğer bu sayı "Amazon KDP ekosisteminde ilgili kategori / ürün tarafından desteklenen / araştırılan / üretilen" gibi bağlama ihtiyaç duyuyorsa cümle tam kurulmalı

Yanlış kullanım örneği:
- "4.719 kitabımız Amazon KDP'de"

Daha güvenli kullanım örnekleri:
- "Amazon KDP ekosisteminde 4.719 kitaplık yayın gerçekliğiyle çalışan bir üretim kategorisindeyiz"
- "KDP için çalışan bu sistem, binlerce yayın örneğinin mantığıyla tasarlandı"
- Eğer gerçekten ürün çıktısıysa:
  "4.719 kitaplık KDP üretim verisiyle şekillenmiş yayın akışı"

En güçlü kullanım alanları:
- pricing
- compare
- use cases / KDP segmenti
- resources / KDP toolkit
- blog / KDP rehber içerikleri

Ana sayfada ise daha kontrollü kullanılmalı:
- "4.719 KDP kitaplık pazar gerçekliği"
- "KDP'de çalışan publishing mantığı"

---

## 3. Funnel Message Rules

### Tüm sayfalarda korunacak sabit mesajlar

Her sayfada aynı anda değil, ama funnel genelinde tekrar eden üç sabit:

- "Önce preview gör, sonra karar ver."
- "Tek akış: brief → outline → chapter → cover → export."
- "KDP'ye giden dosya mantığı ürünün içinde."

### Ana dil kuralları

Tercih edilen kelimeler:
- preview
- taslak
- outline
- yayına hazır
- publishing studio
- branded book
- authority asset
- tek akış
- yönlendirilmiş akış

Kaçınılacak kelimeler:
- bot
- içerik üretim aracı
- jenerik AI tool
- sihirli otomasyon
- bir tıkla her şey olur

### CTA kuralları

Bir sayfada:
- 1 ana CTA
- 1 destek CTA
- 1 proof satırı

İdeal CTA fiilleri:
- Başlat
- Gör
- Dene
- Aç
- İncele
- Devam Et

Kaçınılacak CTA'lar:
- Çok genel "Learn More"
- Çok soyut "Keşfet"
- Çok eşit ağırlıklı 3 farklı birincil CTA

---

## 4. Page-by-Page Strategic Plan

## 4.1 Home

Sayfa:
- `web/src/app/page.tsx`

Kullanıcı durumu:
- soğuk trafik
- düşük güven
- yüksek merak
- yüksek şüphe

Ana soru:
- "Bu ürün tam olarak ne yapıyor ve bana gerçekten yardımcı olur mu?"

Ana psikolojik bariyer:
- belirsizlik
- kalite kuşkusu
- zaman kaybı korkusu

Birincil hedef:
- `/start/topic` geçişi

Psikoloji modelleri:
- Activation Energy
- Present Bias
- Social Proof
- Loss Aversion

Mesaj mimarisi:
- Layer 1:
  Ürün bir tool değil, publish-ready kitap akışı
- Layer 2:
  Kullanıcı boş sayfadan başlamaz
- Layer 3:
  Önce preview görür
- Layer 4:
  KDP ve export proof'u görür

Revize hero önerisi:
- Başlık:
  "Uzmanlığını kısa sürede görülebilir bir kitaba çevir."
- Alt başlık:
  "Konunu yaz, wizard seni yönlendirsin. Outline, kapak ve ilk preview aynı akışta oluşsun. ChatGPT, Canva ve export araçları arasında dağılma."
- Proof satırı:
  "Önce ücretsiz preview gör. Beğenirsen tam kitabı aç."

Önerilen alt proof bar:
- "Kayıt olmadan başla"
- "Kredi kartı gerekmez"
- "KDP uyumlu EPUB/PDF mantığı"

Eklenmesi gereken blok:
- "Neden şimdi?"
  "Aklındaki kitap aylarca notlarda kalmasın."
- "Neden güven?"
  "Gerçek preview, gerçek export mantığı, KDP proof."

Önerilen CTA:
- Birincil:
  "Ücretsiz Preview Başlat"
- İkincil:
  "Örnek Kitapları Gör"

Test hipotezi:
- Eğer hero'da "10 dakika", "preview", "önce gör sonra öde" üçlüsü birlikte görünürse start CTR artar

KPI:
- homepage to start CTR
- homepage scroll depth
- examples click-through

---

## 4.2 Pricing

Sayfa:
- `web/src/app/pricing/page.tsx`

Kullanıcı durumu:
- yüksek niyet
- fiyat hassasiyeti
- karşılaştırma modunda

Ana soru:
- "Bu fiyat mantıklı mı?"

Ana psikolojik bariyer:
- yanlış plan seçme korkusu
- fazla ödeme korkusu
- kaliteye değip değmeyeceği kuşkusu

Birincil hedef:
- plan seçimi
- `$4 premium` veya `starter/creator`

Psikoloji modelleri:
- Anchoring
- Decoy Effect
- Mental Accounting
- Regret Aversion

Mesaj mimarisi:
- Layer 1:
  Ajans / ghostwriter ile fiyat kontrastı
- Layer 2:
  $4 giriş noktasının düşük riskli oluşu
- Layer 3:
  Hacim arttıkça kitap başı maliyet düşüşü
- Layer 4:
  İade güvencesi

Revize hero önerisi:
- Başlık:
  "Ghostwriter yerine bu hafta kitabın elinde olsun."
- Alt başlık:
  "İlk kitap için $4 ile tam erişim aç. Düzenli üretim için aylık planlara geç. Önce preview'ı gör, sonra karar ver."

Plan konumlandırma:
- Tek Kitap:
  "İlk kez deneyen için en düşük riskli seçenek"
- Starter:
  "Düzenli üretime yeni geçenler"
- Creator:
  "En mantıklı denge"
- Studio:
  "Yüksek hacim, ekip, ajans"

Proof kullanımı:
- `2 KDP kitabı canlı` küçük proof
- `4.719 KDP kitaplık pazar gerçekliği` büyük kategori proof

Önerilen CTA:
- Tek Kitap:
  "$4 ile Tam Kitabı Aç"
- Creator:
  "En Mantıklı Plan: Yazar"

Zorunlu iş:
- refund-policy dilini pricing ile birebir hizala

Test hipotezi:
- "En Mantıklı Plan" etiketi Creator dönüşümünü artırır

KPI:
- pricing to checkout CTR
- premium vs creator split
- refund policy click-through

---

## 4.3 Compare

Sayfa:
- `web/src/app/compare/page.tsx`

Kullanıcı durumu:
- alternatif düşünüyor
- mevcut alışkanlıklarını savunuyor

Ana soru:
- "ChatGPT ile niye yapmayayım?"

Ana psikolojik bariyer:
- status quo bias

Psikoloji modelleri:
- Contrast Effect
- Opportunity Cost
- Status-Quo Bias kırma

Mesaj mimarisi:
- Sorun model değil, workflow
- Sorun yazmak değil, sistemi kurmak
- Sorun fiyat değil, dağınık yolun toplam maliyeti

Revize hero:
- Başlık:
  "ChatGPT ile başlayabilirsin. Bitirmek için yetmeyebilir."
- Alt başlık:
  "Sorun zeka değil; dağınık workflow, prompt tekrarları, bağlam kaybı ve export zincirinin kopuk olması."

Ek blok:
- "Manuel yolun gerçek maliyeti"
  "Prompt yazma, ton koruma, kapağı ayrı çözme, export'u ayrı tamamlama."

Önerilen CTA:
- "Kendi Konunla Farkı Gör"

Test hipotezi:
- Duygusal maliyet copy'si teknik özellik tablosundan daha fazla CTA tıklaması üretir

KPI:
- compare to start CTR
- compare dwell time

---

## 4.4 How It Works

Sayfa:
- `web/src/app/how-it-works/page.tsx`

Kullanıcı durumu:
- süreç anlamak istiyor
- karmaşıktan çekiniyor

Psikoloji modelleri:
- BJ Fogg
- Hick's Law
- Goal-Gradient

Ana problem:
- adımlar net ama küçük ödüller daha net gösterilebilir

Hero önerisi:
- Başlık:
  "Boş sayfadan değil, yönlendirilmiş bir preview'dan başlarsın."
- Alt başlık:
  "Önce konu, sonra outline, sonra preview. Her adımda ne olacağını bilerek ilerlersin."

Adım sonunda görünen ödül mantığı:
- 1:
  "Net kitap yönü"
- 2:
  "Görünür outline"
- 3:
  "Preview ve export yolu"

CTA:
- "3 Adımı Şimdi Kendin Dene"

Test hipotezi:
- Adım kartlarının altında "elde edeceğin çıktı" yazarsa start CTR artar

KPI:
- how-it-works to start CTR

---

## 4.5 Use Cases

Sayfa:
- `web/src/app/use-cases/page.tsx`

Kullanıcı durumu:
- ürünün kendisi için uygun olup olmadığını değerlendiriyor

Psikoloji modelleri:
- Unity Principle
- Similarity Bias
- Availability Heuristic

Ana problem:
- segmentler iyi ama her segmentin "neden şimdi" nedeni daha net yazılmalı

Hero önerisi:
- Başlık:
  "Herkes için değil. Doğru kullanıcı için çok güçlü."
- Alt başlık:
  "Uzmanlar, eğitmenler, creator'lar ve KDP yayıncıları için publish-ready non-fiction akışı."

Segment bazlı kısa payoff:
- Yazar:
  "Aylardır başlayamadığın kitabı taslağa çevir"
- Danışman:
  "Uzmanlığını authority asset'e dönüştür"
- Eğitmen:
  "Kursunu rehber kitaba paketle"
- KDP:
  "Başlık üretimini sistemleştir"
- Creator:
  "Dağınık içeriği ürünleştir"

CTA:
- "Bana En Yakın Senaryoyla Başla"

Test hipotezi:
- Segment kartlarında "en iyi kullanım amacı" etiketi tıklamayı artırır

KPI:
- segment CTA CTR

---

## 4.6 Examples

Sayfa:
- `web/src/app/examples/page.tsx`

Kullanıcı durumu:
- kalite görmek istiyor

Psikoloji modelleri:
- Social Proof
- Endowment Effect
- Mere Exposure

Ana problem:
- proof güçlü ama sahiplenme daha da güçlenebilir

Hero önerisi:
- Başlık:
  "Vaat değil, görülebilir kitap."
- Alt başlık:
  "Kapak, bölüm yapısı, positioning ve export mantığı aynı sistemden çıkan gerçek örnekler."

Ek öneri:
- Her örneğe yakın CTA:
  "Buna Benzer Kitap Başlat"

CTA:
- "Kendi Preview'ını Gör"

Test hipotezi:
- Prefilled CTA examples to start dönüşümünü yükseltir

KPI:
- examples preview modal open rate
- examples to start CTR

---

## 4.7 FAQ

Sayfa:
- `web/src/app/faq/page.tsx`

Kullanıcı durumu:
- son itirazları temizliyor

Psikoloji modelleri:
- Regret Aversion
- Authority Bias
- Pratfall Effect

Ana problem:
- "kimler için değil" daha yukarı gelebilir

Hero önerisi:
- Başlık:
  "Kararı geciktiren soruların kısa cevapları."

Ek zorunlu bölüm:
- "Kimler için doğru değil?"

CTA:
- "Soruların Temizse Preview'ı Başlat"

KPI:
- faq to start CTR

---

## 4.8 Resources

Sayfa:
- `web/src/app/resources/page.tsx`

Kullanıcı durumu:
- hemen denemek istemeyebilir ama ilgisi var

Psikoloji modelleri:
- Reciprocity
- Mere Exposure
- Commitment & Consistency

Hero önerisi:
- Başlık:
  "Kitabını daha hızlı çıkarman için ücretsiz karar araçları."
- Alt başlık:
  "Sadece okumalık değil; seni gerçek üretime yaklaştıran rehberler, checklist'ler ve araçlar."

CTA:
- "Kaynak Yeterliyse Şimdi Kitabı Başlat"

KPI:
- resources to tool CTR
- resources to start CTR

---

## 4.9 Blog

Sayfa:
- `web/src/app/blog/page.tsx`

Kullanıcı durumu:
- içerikle ikna olmaya açık

Psikoloji modelleri:
- Authority Bias
- Availability Heuristic
- Confirmation Bias alignment

Ana problem:
- içerik başlıkları daha davranışsal yapılabilir

Başlık yönleri:
- "Neden kitap yazmaya başlayamıyorsun?"
- "ChatGPT ile outline çıkıyor ama kitap niye bitmiyor?"
- "KDP'ye yüklemeden önce 7 kritik kontrol"
- "Authority book mu, lead magnet mı?"

CTA:
- "Okumayı Bırakıp Kendi Konunla Dene"

KPI:
- blog to start CTR
- featured article CTR

---

## 4.10 About

Sayfa:
- `web/src/app/about/page.tsx`

Kullanıcı durumu:
- ekip ve ürün yaklaşımını anlamak istiyor

Psikoloji modelleri:
- Authority Bias
- Pratfall Effect

Hero önerisi:
- Başlık:
  "Daha fazla özellik değil, daha fazla biten kitap."
- Alt başlık:
  "İlk kez kitap çıkaran biri için en büyük sorun seçenek çokluğu. Ürünü bu yüzden yönlendirici tasarladık."

CTA:
- "Bu Yaklaşımı Üründe Gör"

KPI:
- about to start CTR

---

## 4.11 Contact

Sayfa:
- `web/src/app/contact/page.tsx`

Kullanıcı durumu:
- yüksek niyetli
- soru var

Psikoloji modelleri:
- Friction Reduction

Hero önerisi:
- Başlık:
  "Kısa sorular için hızlı cevap."
- Alt başlık:
  "Plan, kullanım senaryosu veya ekip akışı için yaz. Gereksiz kurumsal dil yok."

CTA:
- "Mesaj Gönder"

KPI:
- form submit rate

---

## 4.12 Start

Sayfa:
- `web/src/app/start/page.tsx`

Kullanıcı durumu:
- başlamak üzere

Psikoloji modelleri:
- Default Effect
- Activation Energy
- Paradox of Choice

Ana problem:
- önerilen yol daha baskın olabilir

Hero önerisi:
- Başlık:
  "Fikrinden ilk preview'a tek başlangıç."
- Alt başlık:
  "En doğru ilk adım wizard'dır. Örnekler ve fiyatlar burada; ama kitabını görmek istiyorsan şimdi başla."

Kart sistemi:
- Wizard kartına "Önerilen başlangıç" etiketi

CTA:
- "Wizard'ı Başlat"

KPI:
- start page primary card CTR

---

## 4.13 Signup

Sayfa:
- `web/src/app/signup/page.tsx`

Kullanıcı durumu:
- intent yüksek
- sürtünme hassas

Psikoloji modelleri:
- Loss Aversion
- Commitment & Consistency

Başlık önerisi:
- "Preview'ını kaydet ve kaldığın yerden devam et"

Alt başlık:
- "Bu adım ödeme için değil; hazırlanan kitabı hesabına bağlamak için."

CTA:
- "Hesabı Oluştur ve Preview'ı Kaydet"

KPI:
- signup completion rate

---

## 4.14 Login

Sayfa:
- `web/src/app/login/page.tsx`

Psikoloji modelleri:
- Commitment continuity

Başlık önerisi:
- "Kitabın kaldığı yerden devam etsin"

CTA:
- "Giriş Yap ve Devam Et"

KPI:
- login completion rate

---

## 4.15 Refund Policy

Sayfa:
- `web/src/app/refund-policy/page.tsx`

Stratejik not:
- Bu sayfa marketing sayfası kadar trust sayfası
- Pricing ile çelişmemeli

Mevcut risk:
- pricing dili "30 gün soru sormadan iade"
- refund page dili daha muğlak

Öneri:
- Eğer gerçekten 30 gün koşulsuz model varsa burada açık yazılmalı
- değilse pricing düzeltilmeli

Hero önerisi:
- Başlık:
  "Risk almadan denemen için açık iade politikası."

CTA:
- Bu sayfa CTA'sız da olabilir

KPI:
- pricing geri dönüşüne etkisi dolaylı ölçülür

---

## 4.16 Privacy

Sayfa:
- `web/src/app/privacy/page.tsx`

Rol:
- yüksek dikkatli kullanıcı için güven yüzeyi

Psikoloji:
- Regret Aversion
- Risk Reduction

Öneri:
- "İçerik sana ait" ve "eğitim verisinde kullanılmaz" gibi netlik gerekiyorsa burada açıklaştırılmalı

KPI:
- signup flow drop recovery etkisi

---

## 4.17 Terms

Sayfa:
- `web/src/app/terms/page.tsx`

Rol:
- yasal güven

Öneri:
- "Araç sağlar, son yayın sorumluluğu kullanıcıdadır" copy'si iyi
- daha okunabilir özet kartları korunmalı

---

## 4.18 Book Idea Validator

Sayfa:
- `web/src/app/tools/book-idea-validator/page.tsx`
- `web/src/components/site/book-idea-validator-tool.tsx`

Kullanıcı durumu:
- henüz tam karar vermemiş
- kendi fikri üzerinden ilerlemek istiyor

Psikoloji modelleri:
- IKEA Effect
- Commitment & Consistency
- Curiosity Gap

Hero önerisi:
- Başlık:
  "Kitap fikrin güçlü mü, yalnızca kulağa hoş mu geliyor?"

Email gate önerisi:
- "Tam raporda ne var?"
  "Title angles, positioning önerisi, mini outline ve doğru format tavsiyesi."

CTA:
- "Fikrimi Puanla"
- "Tam Raporu Gönder"
- "Bu Fikirle Preview Başlat"

KPI:
- tool completion rate
- email capture rate
- tool to start CTR

---

## 4.19 Wizard Flow

Yüzey:
- `web/src/components/funnel/guided-wizard-screen.tsx`

Kullanıcı durumu:
- sıcak intent
- abandonment riski var

Psikoloji modelleri:
- Goal-Gradient
- Zeigarnik Effect
- Nudge Theory

Gerekli mikro copy sistemi:
- "1/5 tamamlandı"
- "Preview'a 4 adım kaldı"
- "Bu adım bittiğinde başlık ve kitap yönünü göreceksin"
- "Neredeyse oradasın"

Adım CTA'ları:
- Topic:
  "Başlık Önerilerine Geç"
- Title:
  "Bölüm Planını Oluştur"
- Outline:
  "Stil ve Kapak Yönünü Seç"
- Style:
  "Preview'ı Hazırla"

KPI:
- step-to-step completion
- style to generate conversion

---

## 4.20 Auth Gate

Yüzey:
- `web/src/components/funnel/generate-auth-gate-dialog.tsx`

Psikoloji modelleri:
- Loss Aversion
- Regret Aversion
- Framing

Ana öneri:
- "Üyelik gerekli" değil
- "Hazırlanan kitabı hesabına kaydedelim"

Başlık:
- "Hazırlanan kitabı hesabına kaydedelim"

Alt metin:
- "Bu adım ödeme istemez. Preview hazırlanırken kitabının kaybolmaması için hesabını oluşturuyoruz."

CTA:
- "Hesap Oluştur ve Preview'ı Hazırla"

KPI:
- auth gate completion rate

---

## 4.21 Upgrade Screen

Yüzey:
- `web/src/components/funnel/upgrade-screen.tsx`

Kullanıcı durumu:
- preview'ı gördü
- satın almaya yakın

Psikoloji modelleri:
- Endowment Effect
- Loss Aversion
- Anchoring
- Social Proof

Hero önerisi:
- Başlık:
  "Kitabın hazır. Şimdi tamamını aç."
- Alt başlık:
  "Preview'da gördüğün yapı burada bitmiyor. Tüm bölümleri, export dosyalarını ve çalışma alanını tek adımda aç."

Plan konumu:
- Tek Kitap:
  "Bu kitap için en mantıklı unlock"
- Starter:
  "Bir kitabın ötesine geçeceksen"

CTA:
- "$4 ile Tam Kitabı Aç"

Proof:
- küçük proof:
  "KDP uyumlu export"
- büyük proof:
  "4.719 kitaplık pazar mantığıyla tasarlanmış yayın akışı"

KPI:
- paywall to checkout
- premium plan selection rate

---

## 5. Implementation Roadmap

### Faz 1: Dönüşüm temeli

Öncelik:
1. Home
2. Pricing
3. Start
4. Wizard
5. Upgrade
6. Refund alignment

Beklenen etki:
- start rate artışı
- paywall dönüşüm artışı
- pricing clarity artışı

### Faz 2: Güven ve segmentasyon

Öncelik:
1. Compare
2. Examples
3. FAQ
4. Use Cases
5. Signup / Login

Beklenen etki:
- daha düşük şüphe
- daha yüksek segment self-identification
- daha düşük auth abandonment

### Faz 3: Eğitim ve nurture

Öncelik:
1. Resources
2. Blog
3. About
4. Contact
5. Privacy / Terms

Beklenen etki:
- nurture traffic'ten ürün girişleri
- authority algısı

---

## 6. Experiment Plan

### Test 1

Hipotez:
- Hero'da "preview" kelimesi "AI kitap yazma" ifadesinden daha yüksek start CTR üretir

Varyantlar:
- A: AI kitap yazma aracı
- B: ücretsiz preview odaklı

Başarı metriği:
- start CTR

### Test 2

Hipotez:
- Creator planında "En Mantıklı Plan" etiketi conversion artırır

Metriği:
- plan selection rate

### Test 3

Hipotez:
- Wizard'da ilerleme metni abandonment'i düşürür

Metriği:
- step completion rate

### Test 4

Hipotez:
- Examples sayfasında prefilled CTA start CTR'ı artırır

Metriği:
- examples to start CTR

### Test 5

Hipotez:
- Auth gate'de "üyelik gerekli" yerine "kitabını kaydet" framing'i completion artırır

Metriği:
- auth gate completion rate

---

## 7. KPI Dashboard

Takip edilmesi gereken ana metrikler:

- homepage to start CTR
- start page primary card CTR
- wizard step completion rate
- generate to auth gate completion
- preview to paywall conversion
- paywall to checkout conversion
- pricing plan selection split
- tool email capture rate
- examples to start CTR
- compare to start CTR
- faq to start CTR
- signup completion rate
- login completion rate

Segment bazlı ölçüm:
- danışman
- creator
- eğitmen
- KDP yayıncı

Plan bazlı ölçüm:
- Tek Kitap
- Starter
- Creator
- Studio

---

## 8. Final Positioning

Book Generator için önerilen en güçlü positioning:

"Fikri, davranış tasarlanmış bir publishing akışıyla preview'dan yayına hazır kitaba dönüştüren AI publishing studio."

Daha kısa versiyon:

"Boş sayfa korkusunu publish-ready kitaba çeviren AI publishing studio."

