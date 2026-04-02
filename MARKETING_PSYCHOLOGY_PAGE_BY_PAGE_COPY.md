# Marketing Psychology: Page-by-Page Revize Copy Dokümanı

Son güncelleme: 2026-04-02

Bu doküman, Book Generator'ın public funnel sayfaları için davranış bilimi odaklı mesaj mimarisini tanımlar.

Amaç:
- Her sayfada hangi davranışı tetiklemek istediğimizi netleştirmek
- Copy kararlarını psikoloji modeliyle bağlamak
- Hero, destek mesajı ve CTA katmanlarını sadeleştirmek
- Tüm funnel boyunca aynı güven ve hız dilini korumak

Ana ürün gerçeği:
- Kullanıcı teknik olarak kitap yazma aracı aramıyor
- Asıl problem: başlama eşiği, boş sayfa korkusu, dağınık araç yorgunluğu, para riski, kalite endişesi

Ana psikoloji omurgası:
- Activation Energy: başlamayı aşırı kolaylaştır
- Loss Aversion: gecikmenin maliyetini göster
- Regret Aversion: önce preview, sonra ödeme
- Goal-Gradient Effect: kullanıcıya ilerlediğini hissettir
- Social Proof: görülebilir çıktı ve gerçek yayın kanıtı
- Anchoring: ghostwriter, ajans ve dağınık araç zinciriyle fiyat kontrastı
- Commitment and Consistency: küçük adımla başlat, sonra derinleştir
- Paradox of Choice: tek önerilen aksiyon bırak

Ortak mesaj kuralları:
- "AI tool" değil, "publishing studio" dili kullanılmalı
- "oluştur" yerine mümkün olduğunda "başlat", "gör", "çıkar", "yayınla" dili tercih edilmeli
- Her kritik yüzeyde risk düşürücü cümle görünmeli:
  "Önce preview gör, sonra karar ver."
- Her ana sayfada en az bir somut proof görünmeli:
  "2 kitap Amazon KDP'de canlı"
- CTA sayısı düşük tutulmalı, birincil aksiyon her zaman belirgin olmalı

## 1. Ana Sayfa

Sayfa:
- `web/src/app/page.tsx`

Ana hedef:
- Ziyaretçiyi ilk kez denemeye ikna etmek

Tetiklenecek davranış:
- "Daha sonra bakarım" yerine hemen preview başlatmak

Psikoloji modeli:
- Activation Energy
- Present Bias
- Loss Aversion
- Social Proof

Ana problem:
- Mevcut copy iyi ama ürünün en büyük kazanımı olan "başlamayı kolaylaştırma" daha sert söylenebilir

Revize hero copy:
- Başlık:
  "Uzmanlığını 10 dakikada görülebilir bir kitaba çevir."
- Alt başlık:
  "Konunu yaz, wizard seni yönlendirsin. Outline, kapak ve ilk preview aynı akışta oluşsun. ChatGPT, Canva ve export araçları arasında dağılma."
- Güven satırı:
  "Önce ücretsiz preview gör. Tam kitap ve export için sonra karar ver."

Destek blok önerisi:
- "Neden şimdi?"
  "Aklındaki kitap aylarca notlarda kalmasın. İlk taslağı görmek, kitabı bitirmenin en hızlı yolu."
- "Ne görürüm?"
  "Başlık, bölüm planı, kapak yönü ve ilk içerik preview."
- "Neden güveneyim?"
  "2 kitap Amazon KDP'de canlı. Süreç yalnızca fikir üretmez; yayın dosyasına kadar gider."

Önerilen CTA:
- Birincil:
  "Ücretsiz Preview Başlat"
- İkincil:
  "Örnek Kitapları Gör"

CTA alt metni:
- "Kredi kartı gerekmez"
- "Kayıt olmadan başlayabilirsin"

Not:
- Ana sayfada "ghostwriter $5,000 vs $4" mesajı korunmalı ama ilk ekranın merkezinde değil, ilk güven bloğundan sonra gelmeli

## 2. Pricing

Sayfa:
- `web/src/app/pricing/page.tsx`

Ana hedef:
- Fiyat itirazını kırmak ve doğru planı seçtirmek

Tetiklenecek davranış:
- "Pahalı mı?" sorusundan "hangi plan bana uygun?" sorusuna geçiş

Psikoloji modeli:
- Anchoring
- Decoy Effect
- Regret Aversion
- Mental Accounting

Ana problem:
- Fiyatlar güçlü, ama plan seçimi daha yönlendirilmiş olabilir
- İade mesajı ile refund-policy dili birebir hizalanmalı

Revize hero copy:
- Başlık:
  "Ghostwriter yerine bu hafta kitabın elinde olsun."
- Alt başlık:
  "Tek kitap için $4 ile tam erişim aç. Düzenli üretim için aylık planlara geç. Önce preview'ı gör, beğenirsen devam et."

Kısa cevap kutusu revizesi:
- "İlk kitabını test etmek için en mantıklı giriş noktası Tek Kitap planı. Düzenli üretim yapacaksan Starter veya Yazar ile kitap başı maliyet hızla düşer."

Plan kartı copy yönü:
- Tek Kitap:
  "İlk kez deniyorsan en düşük riskli giriş"
- Starter:
  "Düzenli üretime geçenler için güvenli ritim"
- Yazar:
  "En mantıklı denge: araştırma + hacim + düşük kitap başı maliyet"
- Stüdyo:
  "Yüksek hacim, ekip veya ajans akışı"

Önerilen CTA:
- Tek Kitap:
  "$4 ile İlk Kitabı Aç"
- Starter:
  "Starter ile Başla"
- Yazar:
  "En Mantıklı Plan: Yazar"
- Stüdyo:
  "Stüdyo Planını İncele"

CTA alt metni:
- "30 gün iade"
- "İptal etmesi kolay"
- "Önce preview"

Zorunlu düzeltme notu:
- `web/src/app/refund-policy/page.tsx` copy'si pricing'deki "30 gün soru sormadan iade" mesajıyla çelişmemeli

## 3. Compare

Sayfa:
- `web/src/app/compare/page.tsx`

Ana hedef:
- Genel AI araçları ile özel workflow arasındaki farkı görünür kılmak

Tetiklenecek davranış:
- "ChatGPT ile de yaparım" itirazını kırmak

Psikoloji modeli:
- Contrast Effect
- Status-Quo Bias kırma
- Opportunity Cost

Ana problem:
- Mevcut karşılaştırma özellik merkezli; duygusal maliyet daha görünür olmalı

Revize hero copy:
- Başlık:
  "ChatGPT ile başlayabilirsin. Bitirmek için yetmeyebilir."
- Alt başlık:
  "Sorun model gücü değil; dağınık workflow, bağlam kaybı ve yayın dosyasına giden zincirin kopuk olması."

Ek blok önerisi:
- "Manuel yolun gizli maliyeti"
  "Her bölüm için yeniden prompt yazmak, tonu korumak, kapağı ayrı üretmek ve export'u ayrı çözmek kitabı geciktirir."

Önerilen CTA:
- Birincil:
  "Kendi Konunla Farkı Gör"
- İkincil:
  "Örnek Çıktıları İncele"

## 4. How It Works

Sayfa:
- `web/src/app/how-it-works/page.tsx`

Ana hedef:
- Süreci anlaşılır hale getirip belirsizliği azaltmak

Tetiklenecek davranış:
- "Karmaşık mı?" itirazını yok etmek

Psikoloji modeli:
- BJ Fogg Behavior Model
- Goal-Gradient Effect
- Hick's Law

Ana problem:
- Adımlar net, fakat her adımın sonunda elde edilen küçük ödül daha görünür olmalı

Revize hero copy:
- Başlık:
  "Boş sayfadan değil, yönlendirilmiş bir preview'dan başlarsın."
- Alt başlık:
  "Önce konu, sonra outline, sonra preview. Her adımda ne olacağını bilerek ilerlersin."

Adım copy formatı:
- 1. adım sonu:
  "Elinde net kitap yönü olur"
- 2. adım sonu:
  "Başlık ve bölüm omurgası görünür hale gelir"
- 3. adım sonu:
  "Preview ve export yolu netleşir"

Önerilen CTA:
- "3 Adımı Şimdi Kendin Dene"

## 5. Use Cases

Sayfa:
- `web/src/app/use-cases/page.tsx`

Ana hedef:
- Ziyaretçinin kendini doğru segmentte görmesi

Tetiklenecek davranış:
- "Bu ürün bana göre mi?" sorusuna hızlı evet dedirtmek

Psikoloji modeli:
- Unity Principle
- Similarity Bias
- Availability Heuristic

Ana problem:
- Segmentler iyi; satın alma nedeni her segmentte daha keskin yazılmalı

Revize hero copy:
- Başlık:
  "Herkes için değil. Doğru kullanıcı için çok güçlü."
- Alt başlık:
  "Uzmanlar, eğitmenler, creator'lar ve KDP yayıncıları için: fikirden publish-ready non-fiction kitaba giden tek akış."

Segment card copy yönü:
- Yazar:
  "Aylardır başlayamadığın kitabı taslağa çevir"
- Danışman:
  "Uzmanlığını authority asset'e dönüştür"
- Eğitmen:
  "Kursunu rehber kitaba paketle"
- KDP:
  "Başlık üretim hızını operasyonel hale getir"
- Creator:
  "Dağınık içeriğini satılabilir kitaba çevir"

Önerilen CTA:
- "Bana En Yakın Senaryoyla Başla"

## 6. Examples

Sayfa:
- `web/src/app/examples/page.tsx`

Ana hedef:
- Ürünün gerçekten çıktı verdiğini kanıtlamak

Tetiklenecek davranış:
- "Kaliteyi görmeden güvenmem" itirazını kırmak

Psikoloji modeli:
- Social Proof
- Endowment Effect
- Mere Exposure Effect

Ana problem:
- Sayfa proof veriyor ama kişisel sahiplenme duygusu daha da artırılabilir

Revize giriş copy:
- Başlık:
  "Vaat değil, görülebilir kitap."
- Alt başlık:
  "Kapak, başlık, bölüm yapısı ve positioning aynı akıştan çıkmış gerçek örnekler."

Ek copy önerisi:
- "Buna benzer bir kitap üret"
- "Bu örnek sana yakınsa, aynı akışı kendi konunla başlat"

Önerilen CTA:
- Kart altında:
  "Buna Benzer Kitap Başlat"
- Sayfa sonunda:
  "Kendi Preview'ını Gör"

## 7. FAQ

Sayfa:
- `web/src/app/faq/page.tsx`

Ana hedef:
- Kalan itirazları temizlemek

Tetiklenecek davranış:
- Ürünü denemeden önce son şüpheyi gidermek

Psikoloji modeli:
- Regret Aversion
- Pratfall Effect
- Authority Bias

Ana problem:
- SSS güçlü, ama "kimler için değil" mesajı daha yukarı taşınabilir

Revize giriş copy:
- Başlık:
  "Kararı geciktiren soruların kısa cevapları."
- Alt başlık:
  "Kalite, KDP uyumu, fiyat, haklar ve kullanım kolaylığıyla ilgili en kritik itirazları burada netliyoruz."

Ek bölüm önerisi:
- Başlık:
  "Kimler için doğru değil?"
- Copy:
  "Roman, akademik tez veya teknik dokümantasyon için tasarlanmadı. Rehber, authority book, lead magnet ve non-fiction publish akışında güçlü."

Önerilen CTA:
- "Soruların Temizse Preview'ı Başlat"

## 8. Resources

Sayfa:
- `web/src/app/resources/page.tsx`

Ana hedef:
- Kararsız kullanıcıyı düşük riskli içerikle beslemek

Tetiklenecek davranış:
- Ürünü hemen denemeyen kullanıcıyı yakın tutmak

Psikoloji modeli:
- Reciprocity
- Mere Exposure
- Commitment and Consistency

Ana problem:
- Kaynaklar iyi, ama her kaynak "bir sonraki ürün adımına" daha net bağlanmalı

Revize giriş copy:
- Başlık:
  "Kitabını daha hızlı çıkarman için ücretsiz karar araçları."
- Alt başlık:
  "Şablonlar, checklist'ler ve fikir doğrulama araçları. Sadece okumalık değil; seni gerçek üretime yaklaştırmak için."

Önerilen CTA:
- Kaynak kartları:
  "Aracı Aç"
  "Checklist'i Kullan"
  "Template ile Başla"
- Sayfa sonu:
  "Kaynak Yeterliyse Şimdi Kitabı Başlat"

## 9. Blog

Sayfa:
- `web/src/app/blog/page.tsx`

Ana hedef:
- Eğitici içerikle karar hızını artırmak

Tetiklenecek davranış:
- Kullanıcının zihnindeki itirazları içerikle çözmek

Psikoloji modeli:
- Authority Bias
- Availability Heuristic
- Confirmation Bias ile hizalı mesaj

Ana problem:
- Blog positioning'i doğru; başlıklarda daha davranışsal framing kullanılabilir

Başlık format önerileri:
- "Neden kitap yazmaya başlayamıyorsun?"
- "Neden ChatGPT ile outline çıkıyor ama kitap bitmiyor?"
- "KDP'ye yüklemeden önce yapılan 7 kritik hata"
- "Lead magnet kitap mı, authority book mu?"

Sayfa giriş copy:
- Başlık:
  "Karar hızlandıran içerikler."
- Alt başlık:
  "Bu blog trafik için değil; ilk kitabını çıkarırken takıldığın soruları kısa yoldan temizlemek için."

Önerilen CTA:
- "Okumayı Bırakıp Kendi Konunla Dene"

## 10. About

Sayfa:
- `web/src/app/about/page.tsx`

Ana hedef:
- Marka yaklaşımını güven veren şekilde anlatmak

Tetiklenecek davranış:
- "Bu ekip ürünü gerçekten doğru mu anlamış?" sorusuna evet dedirtmek

Psikoloji modeli:
- Authority Bias
- Pratfall Effect
- Map != Territory farkındalığı

Ana problem:
- Tasarım felsefesi iyi, fakat neden kullanıcı psikolojisini bildiğiniz daha açık söylenebilir

Revize hero copy:
- Başlık:
  "Daha fazla özellik değil, daha fazla biten kitap."
- Alt başlık:
  "İlk kez kitap çıkaran biri için en büyük sorun seçenek çokluğu. Bu yüzden ürünü gösterişli değil, yönlendirici tasarladık."

Ek güven bloğu:
- "Neyi çözmeye çalışıyoruz?"
  "İnsanlar yazamadığı için değil, nereden başlayacağını bilemediği için kitap çıkaramıyor."

Önerilen CTA:
- "Bu Yaklaşımı Üründe Gör"

## 11. Contact

Sayfa:
- `web/src/app/contact/page.tsx`

Ana hedef:
- Yüksek niyetli kullanıcıyı destek veya satış konuşmasına taşımak

Tetiklenecek davranış:
- "Yazayım mı yazmayayım mı?" yerine iletişime geçmek

Psikoloji modeli:
- Friction Reduction
- Regret Aversion

Revize giriş copy:
- Başlık:
  "Kısa sorular için hızlı cevap."
- Alt başlık:
  "Plan, kullanım senaryosu veya ekip akışı hakkında netleşmek istiyorsan yaz. Gereksiz form dili yok."

Önerilen CTA:
- "Mesaj Gönder"
- Kurumsal blok varsa:
  "Ekip Kullanımı İçin Yaz"

## 12. Start

Sayfa:
- `web/src/app/start/page.tsx`

Ana hedef:
- Kullanıcıyı funnel'a sokmak

Tetiklenecek davranış:
- Hemen doğru başlangıcı seçmek

Psikoloji modeli:
- Activation Energy
- Default Effect
- Paradox of Choice

Ana problem:
- 3 seçenek mantıklı ama ana öneri daha sert vurgulanmalı

Revize hero copy:
- Başlık:
  "Fikrinden ilk preview'a tek başlangıç."
- Alt başlık:
  "En doğru ilk adım wizard'dır. Örnekler ve fiyatlar istersen burada; ama kitabını görmek istiyorsan şimdi başla."

Kart önerisi:
- İlk kart üst etiketi:
  "Önerilen başlangıç"

Önerilen CTA:
- Birincil kart:
  "Wizard'ı Başlat"
- Diğer kartlar:
  "Önce Örnekleri Gör"
  "Önce Fiyatlara Bak"

## 13. Signup / Login

Sayfalar:
- `web/src/app/signup/page.tsx`
- `web/src/app/login/page.tsx`
- `web/src/components/forms/auth-form.tsx`

Ana hedef:
- Kayıt sürtünmesini azaltmak

Tetiklenecek davranış:
- Formu tamamlamak

Psikoloji modeli:
- Loss Aversion
- Commitment and Consistency
- Framing Effect

Ana problem:
- Form mantıklı; ama copy daha çok "preview'ı kaybetme" hissine bağlanabilir

Signup başlık önerisi:
- "Preview'ını kaydet ve kitabına kaldığın yerden devam et"

Signup alt başlık:
- "Bu adım ödeme için değil; hazırlanan kitabı hesabına bağlamak için."

Login başlık önerisi:
- "Kitabın kaldığı yerden devam etsin"

Önerilen CTA:
- Signup:
  "Hesabı Oluştur ve Preview'ı Kaydet"
- Login:
  "Giriş Yap ve Devam Et"

## 14. Book Idea Validator

Sayfa:
- `web/src/app/tools/book-idea-validator/page.tsx`
- `web/src/components/site/book-idea-validator-tool.tsx`

Ana hedef:
- Email capture ve funnel'a geçiş

Tetiklenecek davranış:
- Kullanıcının kendi fikrine yatırım yapması

Psikoloji modeli:
- Commitment and Consistency
- IKEA Effect
- Curiosity Gap

Ana problem:
- Tool güçlü; email öncesi değer daha görünür hale getirilmeli

Revize hero copy:
- Başlık:
  "Kitap fikrin güçlü mü, yalnızca kulağa hoş mu geliyor?"
- Alt başlık:
  "Konunu, okurunu ve hedefini gir. Sistem fikrinin gücünü puanlasın, doğru açı önerisini versin ve seni outline akışına taşısın."

Email gate copy önerisi:
- "Tam raporu mailine gönderelim"
- "Neden değerli?"
  "Skorun yanında title angle, positioning önerisi ve bir sonraki en mantıklı kitap formatını da alırsın."

Önerilen CTA:
- İlk aşama:
  "Fikrimi Puanla"
- Email sonrası:
  "Tam Raporu Gönder"
- Sonraki adım:
  "Bu Fikirle Preview Başlat"

## 15. Wizard Akışı

Yüzey:
- `web/src/components/funnel/guided-wizard-screen.tsx`

Ana hedef:
- Adım tamamlama oranını yükseltmek

Tetiklenecek davranış:
- Her adımı terk etmeden devam etmek

Psikoloji modeli:
- Goal-Gradient Effect
- Zeigarnik Effect
- Nudge Theory

Ana problem:
- İlerleme yapısı var ama psikolojik ödül dili daha net olabilir

Mikro copy önerileri:
- "1/5 tamamlandı"
- "Preview'a 4 adım kaldı"
- "Bu adım bittikten sonra başlık ve kitap yönünü göreceksin"
- "Neredeyse oradasın"

Adım bazlı CTA örnekleri:
- Topic:
  "Başlık Önerilerine Geç"
- Title:
  "Bölüm Planını Oluştur"
- Outline:
  "Stil ve Kapak Yönünü Seç"
- Style:
  "Preview'ı Hazırla"

## 16. Auth Gate

Yüzey:
- `web/src/components/funnel/generate-auth-gate-dialog.tsx`

Ana hedef:
- Üretim öncesi üyelik bariyerinin sürtünmesini düşürmek

Tetiklenecek davranış:
- Hesap oluşturup üretime devam etmek

Psikoloji modeli:
- Loss Aversion
- Regret Aversion
- Framing Effect

Ana problem:
- Yapı iyi; ama "üyelik gerekli" yerine "kitabını kaybetmemek için" framing'i daha güçlü

Revize başlık:
- "Hazırlanan kitabı hesabına kaydedelim"

Revize alt başlık:
- "Bu adım ödeme istemez. Preview hazırlanırken kitabının kaybolmaması ve sonra aynı yerden devam edebilmen için hesabını oluşturuyoruz."

Önerilen CTA:
- Register:
  "Hesap Oluştur ve Preview'ı Hazırla"
- Login:
  "Giriş Yap ve Preview'a Devam Et"

## 17. Upgrade / Paywall

Yüzey:
- `web/src/components/funnel/upgrade-screen.tsx`

Ana hedef:
- Preview'dan ödeme aşamasına geçiş

Tetiklenecek davranış:
- Tek kitap unlock veya uygun plan satın alma

Psikoloji modeli:
- Loss Aversion
- Anchoring
- Endowment Effect
- Social Proof

Ana problem:
- Mesaj iyi; fakat preview'da gördüğü şeye sahip olma hissi daha da artırılabilir

Revize hero copy:
- Başlık:
  "Kitabın hazır. Şimdi tamamını aç."
- Alt başlık:
  "Preview'da gördüğün yapı burada bitmiyor. Tüm bölümleri, export dosyalarını ve çalışma alanını tek adımda aç."

Plan framing:
- Tek Kitap:
  "Bu kitap için en mantıklı unlock"
- Starter:
  "Bir kitabın ötesine geçeceksen"

Önerilen CTA:
- Tek Kitap:
  "$4 ile Tam Kitabı Aç"
- Starter:
  "Aylık Planla Üretime Devam Et"

CTA alt metni:
- "30 gün iade"
- "Anında erişim"
- "Abonelik zorunlu değil"

## Öncelik Sırası

İlk uygulanması gereken sayfalar:
1. Ana sayfa
2. Pricing
3. Start
4. Wizard
5. Upgrade screen
6. Compare
7. Examples

İkinci dalga:
1. FAQ
2. Use Cases
3. Signup / Login
4. Validator
5. Resources
6. Blog
7. About

## Uygulama Notları

Tüm sayfalarda korunması gereken 3 sabit mesaj:
- "Önce preview gör"
- "2 kitap Amazon KDP'de canlı"
- "Tek akış: brief → outline → chapter → cover → export"

Kaçınılması gereken copy alışkanlıkları:
- Çok genel AI dili
- Aynı sayfada 3-4 eşit CTA
- Çok fazla özellik listesi
- Somut proof olmadan sayı kullanımı
- Pricing, refund ve FAQ arasında çelişen güven dili

## Tek Cümlelik Positioning

Book Generator:
- "Fikri, davranış tasarlanmış bir akışla publish-ready kitaba dönüştüren AI publishing studio."

