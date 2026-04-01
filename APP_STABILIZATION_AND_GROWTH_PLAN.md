# Book Generator Uygulama Stabilizasyonu, Ürün Yapısı ve Büyüme Planı

## Belge Amacı

Bu doküman, `Book Generator` ürününün hem teknik olarak stabil hale gelmesi hem de pazarlanabilir, kolay anlaşılır ve sürdürülebilir bir ürün yapısına kavuşması için hazırlanmış ana yol haritasıdır.

Bu plan üç ana problemi aynı anda çözmeyi hedefler:

1. `/app` deneyiminin teknik olarak kırılmaması
2. ziyaretçinin ne satın aldığını ilk 5-10 saniyede net anlaması
3. ürün içindeki akışın satış, aktivasyon ve teslim açısından daha sürdürülebilir hale gelmesi

Bu belge yalnızca "sayfa tasarımı" planı değildir. Aynı zamanda:

- frontend mimarisi
- route yapısı
- hata yönetimi
- onboarding
- dönüşüm hunisi
- pricing ve CTA konumlandırması
- event tracking
- büyüme ve içerik stratejisi

başlıklarını birlikte ele alır.

---

## 1. Yönetici Özeti

Şu anki durumda ürün iki farklı dünya arasında kalmış görünüyor:

- eski statik `dashboard/` yapısı
- yeni `web/` tabanlı Next.js uygulaması

Bu ayrım teknik olarak kırılgan, pazarlama açısından kafa karıştırıcı ve operasyonel olarak pahalıdır. Kullanıcı açısından bakıldığında ürün şu soruları net cevaplamıyor:

- Bu araç tam olarak ne yapıyor?
- İlk adımım ne?
- Ücretli ürünün gerçek değeri ne?
- Demo, gerçek ürün ve panel arasındaki fark ne?
- Sorun yaşarsam sistem beni nereye götürecek?

Teknik açıdan en kritik bulgular:

- `/app` deneyimi yeni Next uygulamasında bulunuyor
- Next uygulaması çalışmak için modern Node sürümü istiyor
- mevcut makinede `Node 18.19.1` var ve build başarısız oluyor
- `/app` tarafında `error.tsx`, `loading.tsx`, `not-found.tsx` yok
- veri katmanı proxy ile `127.0.0.1:8765` backend'ine bağlı
- auth gerçek auth değil, preview/localStorage tabanlı

Pazarlama açısından en kritik bulgular:

- ana vaat var ama tek cümlelik bir kategori liderliği hissi henüz tam değil
- CTA'lar "ürüne gir" diyor, ama güvenli bir onboarding/activation köprüsü eksik
- public katman ile app katmanı arasında mesaj sürekliliği zayıf
- örnek çıktı, başarı hissi ve ilk kazanım yeterince güçlü paketlenmemiş

Ana öneri:

- ürünün ana frontend kaynağı olarak `web/` seçilmeli
- `dashboard/` yalnızca geçici fallback veya legacy katman olarak ele alınmalı
- `/app` erişimi stabil hale getirilmeden agresif trafik/marketing yapılmamalı
- public site ile app arasında tek bir net kullanıcı yolculuğu tasarlanmalı:

`Landing -> Start -> Wizard -> Workspace -> Export`

---

## 2. Mevcut Durum Teşhisi

### 2.1 Teknik Bulgular

#### Frontend parçalanmış durumda

Depoda iki ayrı frontend yaklaşımı var:

- statik dashboard: `dashboard/`
- Next tabanlı uygulama: `web/`

Bu durum şu riskleri doğuruyor:

- route davranışları iki yerde ayrı ayrı değişebiliyor
- kullanıcı bir tasarım dili görüp başka bir ürün akışına düşebiliyor
- bakım maliyeti artıyor
- bug fix iki farklı katmanda ayrı ayrı yapılmak zorunda kalıyor

#### `/app` deneyimi runtime bağımlı

`web/package.json` modern Node bekliyor. Build denemesinde görülen durum:

- mevcut ortam: `Node 18.19.1`
- gereken minimum: `>=20.9.0`
- package engine hedefi: `>=24.14.0`

Bu şu anlama gelir:

- `/app` route'u teknik olarak "tasarım sorunu" kadar "deploy/runtime sorunu" da taşıyor
- doğru runtime olmadan pazarlama yatırımı doğrudan boşa gidebilir

#### Hata yüzeyi kullanıcı dostu değil

Next app içinde şu kritik dosyalar yok:

- `error.tsx`
- `loading.tsx`
- `not-found.tsx`
- `global-error.tsx`

Sonuç:

- route veya data problemi yaşanınca kullanıcıya kaba bir hata ekranı düşüyor
- ürün profesyonel görünmüyor
- güven kaybı oluşuyor

#### Backend bağımlılığı sert

Next tarafı şu proxy üzerinden backend'e bağlı:

- `web/src/app/api/backend/[...path]/route.ts`

Proxy varsayılan olarak şuraya gidiyor:

- `http://127.0.0.1:8765`

Bu şu riskleri doğuruyor:

- backend yoksa app kırılıyor
- local geliştirme ile production davranışı birbirine karışabiliyor
- kullanıcıya "servis geçici olarak erişilemiyor" gibi kontrollü bir fallback yerine sert hata dönebiliyor

#### Auth gerçek ürün auth'u değil

`preview-auth.ts` localStorage tabanlı demo/preview auth modeli kullanıyor.

Bu kısa vadede hız sağlar ama orta vadede şu problemleri yaratır:

- gerçek ödeme sonrası erişim yönetimi zorlaşır
- cihaz değişiminde oturum güveni zayıf olur
- pazarlama sayfasından ürün içine geçen kullanıcı için profesyonel algı düşer

---

### 2.2 Ürün Bulguları

#### Public site ve app farklı şeyler anlatıyor

Public site nispeten net bir vaat taşıyor:

- fikirden outline'a
- bölüm üretiminden export'a
- EPUB/PDF teslimi

Ama app katmanına girildiğinde kullanıcı bir "ürün merkezi" yerine bazen "geliştirici paneli" hissi alıyor.

Bu durum özellikle ilk kez gelen kullanıcı için sorunlu:

- önce ne yapması gerektiği çok net olmayabiliyor
- hesabın ne kadar gerçek ne kadar preview olduğu belirsiz kalabiliyor
- ürün içindeki aşamalar ile landing üzerindeki vaat arasında bire bir bağ kurulmuyor

#### İlk kazanım daha güçlü paketlenmeli

Bir bilgi ürünü aracında ilk kazanım şudur:

- "İlk kitabım gerçekten oluşmaya başladı"

Bu kazanımın kullanıcıya çok erken verilmesi gerekir. Şu an iyi bir temel var ama daha da netleştirilmeli:

- ilk CTA
- ilk onboarding ekranı
- ilk wizard
- ilk outline üretimi
- ilk export

hepsi aynı hikâyeyi anlatmalı.

#### App içi bilgi mimarisi sade ama daha güçlü olabilir

Mevcut app yapısında şu sekmeler var:

- home
- book
- writing
- research
- publish
- settings

Bu fena değil. Ancak pazarlama perspektifinden bakınca kullanıcının algısı şu sırayla olmalı:

1. Başlat
2. Kitabı şekillendir
3. İçeriği üret
4. Kapak ve çıktı al
5. Sonucu yayınla

Yani mevcut teknik sekmeler biraz daha "müşteri yolculuğu" odaklı sunulmalı.

---

### 2.3 Pazarlama Bulguları

#### Ana kategori cümlesi daha keskin olmalı

Şu ürün aslında şu kategoride konumlandırılmalı:

`Uzmanlığını veya fikrini, kısa bir brief ile outline'a, bölümlere ve yayına hazır dosyalara çeviren AI kitap üretim sistemi`

Bu pozisyonlama landing, pricing, start ve app giriş ekranında aynı tonda görünmeli.

#### CTA mimarisi yeniden düşünülmeli

Şu anda "Uygulamaya gir" mantığı teknik olarak kırılgan olabilir.

Daha sağlıklı akış:

- `İlk kitabını başlat`
- `Örnek çıktıları gör`
- `Nasıl çalıştığını incele`

Bu CTA'lar doğrudan kırılgan bir panel yerine kontrollü onboarding akışına inmeli.

#### Güven sinyalleri sistematik hale getirilmeli

Bu ürünü satın alacak kitle, özellikle şu noktalarda güven ister:

- içerik bana mı ait?
- ilk çıktı ne kadar hızlı gelir?
- Türkçe arayüz / English kitap desteği var mı?
- kapak ve export güvenilir mi?
- gerçekten PDF/EPUB alıyor muyum?

Bu sorular landing, pricing, FAQ ve onboarding içinde tekrar edecek şekilde paketlenmeli.

---

## 3. Ürün Vizyonu

Book Generator'ın hedef konumu şu olmalı:

> "Kitap yazmak isteyen ama boş sayfa, dağınık araçlar ve yayın süreciyle uğraşmak istemeyen kullanıcılar için; fikirden taslağa, bölüm üretiminden kapağa ve EPUB/PDF teslimine kadar tek akışta çalışan premium AI kitap üretim platformu."

Bu vizyonun 5 ana ilkesi:

1. Tek net başlangıç
2. Tek akışta üretim
3. Hatasız veya kontrollü fallback deneyimi
4. Görsel ve teslim kalitesinde güven
5. Operasyonel olarak ölçeklenebilir yapı

---

## 4. Hedef Kullanıcı Segmentleri

### Segment 1: Uzmanlığını rehber kitaba çevirmek isteyen profesyonel

Örnek kullanıcılar:

- danışman
- koç
- eğitmen
- niş uzman

Satın alma motivasyonu:

- uzmanlığı ürünleştirmek
- görünürlük kazanmak
- lead magnet veya premium rehber üretmek

Ana mesaj:

- "Uzmanlığını dağılmadan kitaba çevir."

### Segment 2: İlk bilgi ürününü çıkarmak isteyen creator

Örnek kullanıcılar:

- solo creator
- küçük topluluk yöneticisi
- newsletter sahibi
- mini-course üreticisi

Satın alma motivasyonu:

- ilk ciddi bilgi ürününü yayınlamak
- ebook oluşturmak
- bir fikri hızlıca piyasaya test etmek

Ana mesaj:

- "İlk kitabını daha kısa sürede çıkar."

### Segment 3: English içerik üretmek isteyen Türkçe kullanıcı

Örnek kullanıcılar:

- global kitle hedefleyen eğitmen
- uluslararası satış yapmak isteyen uzman
- Amazon KDP denemek isteyen kullanıcı

Ana mesaj:

- "Arayüz Türkçe, kitabın English olabilir."

---

## 5. Hedef Bilgi Mimarisi

## 5.1 Public Katman

### `/`

Amaç:

- ana vaat
- ürün kategorisi
- hızlı güven inşası
- ilk CTA

Olması gereken bloklar:

1. Hero
2. Kimler için
3. 3 adımda nasıl çalışır
4. Gerçek çıktılar
5. Ürün içi ekran önizlemeleri
6. Güven sinyalleri
7. Fiyatlar
8. SSS
9. Son CTA

### `/how-it-works`

Amaç:

- ürünün mantığını anlatmak
- süreci sadeleştirmek
- itirazları azaltmak

Bloklar:

- brief
- outline
- chapter generation
- cover
- export
- publish readiness

### `/pricing`

Amaç:

- paket ayrımını sade anlatmak
- sınırları netleştirmek
- satın alma kararını hızlandırmak

İlkeler:

- her planın amacı tek cümlede anlaşılmalı
- "çoğu kullanıcı için" plan net görünmeli
- limitler çok karmaşık değil, sonuç odaklı anlatılmalı

### `/examples`

Amaç:

- satış için en kritik güven katmanını kurmak

İçerik:

- örnek başlıklar
- örnek ön kapaklar
- örnek bölüm yapıları
- örnek export görüntüleri

### `/faq`

Amaç:

- satın alma öncesi itirazları kapatmak

Başlıklar:

- haklar
- çıktı kalitesi
- kapak kalitesi
- yayın uygunluğu
- diller
- iade ve planlar

### `/blog`

Amaç:

- SEO
- güven
- uzun kuyruk trafik

İçerik kümeleri:

- AI ile kitap yazma
- KDP hazırlık
- rehber kitap planlama
- bilgi ürünleri
- English ebook üretimi

### `/start`

Amaç:

- ürün öncesi kontrollü giriş ekranı
- login/register yerine aktivasyon odaklı başlangıç

Bu ekranın görevi:

- kullanıcıyı uygulamaya güvenli geçirmek
- bir sonraki adımı netleştirmek
- `/app` kırılırsa fallback sunmak

---

## 5.2 Product Katmanı

### `/app`

Amaç:

- bir "dashboard" değil, kontrol merkezi olmak

Ana içerik:

- tek önerilen sonraki adım
- son kitap
- hızlı başlangıç
- temel metrikler

İlk kez gelen kullanıcı için:

- boş state değil
- yönlendirilmiş başlangıç deneyimi

### `/app/new`

Amaç:

- wizard
- ilk kitabı başlatmak

Hedef:

- kullanıcı 5 sorudan sonra değer görmeli

### `/app/book/[slug]`

Amaç:

- tüm üretim sürecinin çalışma alanı

Sekmeler müşteri diliyle yeniden çerçevelenmeli:

| Mevcut | Önerilen müşteri dili |
|---|---|
| home | Genel görünüm |
| book | Kitap bilgileri |
| writing | Yazım |
| research | Araştırma |
| publish | Çıktı ve yayın |
| settings | Entegrasyonlar |

### `/account` ve `/billing`

Amaç:

- ana üretim akışından ayrık tutmak

Not:

- ana side nav içinde birinci öncelik olmamalı
- ayarlar alanı altında toplanmalı

---

## 6. Teknik Mimari Kararı

## Karar

Ana frontend katmanı olarak `web/` seçilmeli.

### Neden?

- modern route sistemi var
- büyümeye daha uygun
- daha iyi komponent mimarisi var
- public site ve app aynı kod tabanında birleşebilir
- SEO ve ürün deneyimi tek çatı altında sürdürülebilir

### `dashboard/` için öneri

`dashboard/` hemen silinmemeli. Geçici olarak:

- legacy fallback
- kritik static page mirror
- geçiş sürecinde risk azaltıcı katman

olarak tutulmalı.

Orta vadede:

- ya kaldırılmalı
- ya sadece maintenance/legacy rolüne indirilmeli

---

## 7. Faz Bazlı Uygulama Planı

## Faz 0: Stabilizasyon Ön Koşulları

### Hedef

Ürünü tekrar güvenli biçimde çalışır hale getirmek.

### İşler

1. Runtime standardizasyonu
2. Next build zincirini ayağa kaldırmak
3. `/app` için controlled error states eklemek
4. backend erişim kontrolü ve fallback tasarlamak

### Teknik işler

- `web/` için Node sürümünü standardize et
- `.tools/node-v24.14.0-linux-x64` gibi mevcut araçları resmi geliştirme akışına bağla
- `start-web.sh` ve deploy akışını tek kaynak haline getir
- `error.tsx`, `loading.tsx`, `not-found.tsx` ekle
- backend unavailable durumunda özel fallback ekranı oluştur

### Kabul kriterleri

- `/app` beyaz ekran veya generic load error göstermemeli
- backend kapalıysa kullanıcı kontrolsüz hata yerine anlamlı bir ekran görmeli
- build dokümante edilmiş doğru Node sürümüyle geçmeli
- route hatalarında kullanıcı ana CTA'ya veya güvenli geri dönüş yoluna sahip olmalı

---

## Faz 1: Public Site ve App Akışını Birleştirme

### Hedef

Public site ile app arasında tek hikâye kurmak.

### İşler

1. CTA mimarisini yeniden kur
2. `/start` giriş katmanı ekle
3. login/register ekranlarını aktivasyon odaklı hale getir
4. messaging consistency sağla

### Uygulama notları

- `/` üzerindeki ana CTA doğrudan kırılgan `/app` yerine `/start`'a gitmeli
- `/start` içinde üç yol olmalı:
  - ilk kitabını başlat
  - örnek çıktıları incele
  - fiyatları gör
- login/register metni "hesap" değil "ilk kitabını başlat" eksenine kaymalı

### Kabul kriterleri

- kullanıcı landing'den ürün içine geçerken ekran değişse bile ürün hikâyesi bozulmamalı
- her CTA'nın tek bir sonraki adımı olmalı
- "bu ürün tam olarak ne yapıyor?" sorusu 5 saniyede cevaplanmalı

---

## Faz 2: Onboarding ve Aktivasyon

### Hedef

Kullanıcıya ilk gerçek başarıyı en kısa sürede yaşatmak.

### İşler

1. wizard'ı daha güçlü hale getir
2. first-run home state tasarla
3. empty state'leri satış ve başarı odaklı hale getir
4. ilk outline ve ilk export akışını daha görünür yap

### Uygulama notları

- wizard sonunda kullanıcı net bir "ilk kitap hazırlanıyor" deneyimi görmeli
- `/app` ilk kez açıldığında "Kütüphane boş" yerine "İlk kitabını başlat" kartı odakta olmalı
- "sonraki önerilen adım" alanı daha stratejik kullanılmalı
- "EPUB al" ilk tavsiye edilen sonuç olarak konumlanmalı

### Aktivasyon metriği

- kayıt -> ilk wizard tamamlama
- wizard -> outline oluşumu
- outline -> ilk chapter üretimi
- chapter -> ilk export

---

## Faz 3: Workspace Yeniden Çerçeveleme

### Hedef

Çalışma alanını teknik panel değil, üretim merkezi gibi hissettirmek.

### İşler

1. tab isimlerini müşteri diline yaklaştır
2. publish sekmesini teslim merkezi gibi kurgula
3. settings'i entegrasyon odaklı yeniden yaz
4. research ve writing tarafını net sorular etrafında düzenle

### Önerilen dil

- "Kitap" -> "Kitap Bilgileri"
- "Yazım" -> "İçerik Üretimi"
- "Publish" -> "Çıktı ve Yayın"
- "Settings" -> "Entegrasyonlar ve Limitler"

### Kabul kriterleri

- ilk kez gelen biri her sekmenin ne işe yaradığını tahmin edebilmeli
- ürün içi dil teknik değil sonuç odaklı olmalı
- export alanı "dosya oluştur" değil "yayına hazırlan" hissi vermeli

---

## Faz 4: Örnek Çıktı ve Güven Katmanı

### Hedef

Satışa en çok katkı sağlayacak güven yüzeyini sistematik hale getirmek.

### İşler

1. `examples` sayfası
2. örnek kitap vitrinleri
3. kapak kalite örnekleri
4. export örnekleri
5. "ürün ne teslim ediyor?" yüzeyi

### İçerik paketi

- 3 örnek rehber kitap
- 2 örnek business/playbook kitap
- 2 örnek English ebook
- kapak öncesi/sonrası örnekleri
- outline -> bölüm -> export zinciri görselleri

### Kabul kriterleri

- satış sayfasında gerçek örnekler bulunmalı
- kullanıcı sadece vaat değil çıktı da görmeli
- destek ekibi örnek göstermeden ürünü anlatabilir hale gelmeli

---

## Faz 5: Pricing, Planlar ve Ticari Netlik

### Hedef

Satın alma kararını hızlandırmak ve plan karışıklığını azaltmak.

### İşler

1. plan anlatımını sonuç odaklı yaz
2. limitleri teknik değil ticari dile çevir
3. "çoğu kullanıcı için" planı öne çıkar
4. iade ve faturalama güven metinlerini sadeleştir

### Önerilen yapı

- Starter: ilk kitap testi
- Creator: düzenli üretim
- Pro: yoğun ve ekip odaklı kullanım

### Kabul kriterleri

- her planın kime ait olduğu ilk bakışta anlaşılmalı
- fiyat tablosu okumadan da doğru plan seçilebilir olmalı
- billing ekranı ürünün güvenilirliğini aşağı çekmemeli

---

## Faz 6: Ölçümleme ve Büyüme Altyapısı

### Hedef

Ürünü hisle değil veriyle geliştirmek.

### Ölçülmesi gereken ana event'ler

- landing hero CTA click
- pricing CTA click
- start page completion
- register completion
- wizard started
- wizard completed
- outline generated
- first chapter generated
- cover generated
- first export success
- billing page opened
- checkout started
- checkout completed

### Ana metrikler

#### Acquisition

- organik trafik
- blog'dan start page'e geçiş
- pricing sayfasına ulaşma oranı

#### Activation

- kayıt -> wizard tamamlama
- wizard -> outline oluşturma
- outline -> export alma

#### Revenue

- pricing -> checkout dönüşümü
- deneme -> ücretli kullanım oranı
- plan bazında retention

#### Product Health

- `/app` load success rate
- backend proxy error rate
- export success rate
- cover generation success rate

---

## 8. Sayfa Bazlı İçerik ve Konumlandırma Planı

## 8.1 Landing Hero

### Amaç

İlk 5 saniyede ürün kategorisini netleştirmek.

### Önerilen mesaj çerçevesi

Başlık:

`Fikrini, outline'dan EPUB'a giden gerçek bir kitaba çevir.`

Alt metin:

`Book Generator; başlık, taslak, bölüm yazımı, kapak ve export sürecini tek akışta toplayan AI kitap üretim platformudur.`

CTA:

- `İlk kitabını başlat`
- `Örnek çıktıları gör`

### Hero altında güven sinyalleri

- Türkçe panel
- English kitap desteği
- kapak + EPUB/PDF
- tek akış

---

## 8.2 How It Works

### Amaç

Kullanıcıyı "çok şey var" duygusundan çıkarıp "3 adım var" duygusuna taşımak.

### Önerilen 3 adım

1. Konunu ve hedef okuyucunu gir
2. Outline ve içerik akışını oluştur
3. Kapağı ekle, EPUB/PDF teslim al

---

## 8.3 Examples

### Amaç

En güçlü satış katmanı olmak.

### Sayfa bölümleri

1. örnek kapak galerisi
2. örnek kitap başlıkları
3. örnek outline ekranı
4. örnek bölüm içeriği
5. export ekranı

---

## 8.4 Start / Onboarding

### Amaç

Public siteden app'e geçişte kopukluk yaratmamak.

### İçerik

- kısa vaat tekrarı
- ne kadar süreceği
- hangi çıktıyı alacağı
- 1 ana CTA
- 1 demo/örnek CTA

---

## 9. UX ve Yazım İlkeleri

### Temel kurallar

1. Her ekranda tek bir ana iş olmalı
2. Bir ekranda en fazla bir ana CTA baskın olmalı
3. Teknik dil yerine çıktı dili kullanılmalı
4. İlk kez gelen kullanıcı için boş ekran bırakılmamalı
5. Hata ekranı bile kullanıcıyı bir sonraki güvenli adıma götürmeli

### Yasak hisler

- "ben yanlış yere geldim"
- "bu demo mu gerçek ürün mü belli değil"
- "bunu kullanmak için çok fazla şey öğrenmem gerekiyor"
- "bir şey bozuldu ve ne yapacağımı bilmiyorum"

---

## 10. Tasarım İlkeleri

### Görsel yön

- premium ama sade
- yaratıcı ama güven veren
- teknoloji ürünü ama geliştirici aracı gibi görünmeyen
- modern publishing ürünü hissi

### App hissi

- komut merkezi değil üretim stüdyosu
- "dashboard" değil "workspace"
- "settings" değil "kontrol ve entegrasyon"

### Public hissi

- güvenilir SaaS
- bilgi ürünü odaklı
- çıktı merkezli

---

## 11. Riskler

### Risk 1

Next app runtime çözülmeden redesign'e başlanırsa görsel çalışma satışa dönüşmez.

### Risk 2

İki frontend birlikte yaşamaya devam ederse ekip yön kaybeder.

### Risk 3

Gerçek auth ve ödeme akışı planlanmadan preview modeline aşırı yük bindirilirse ürün güven problemi yaşar.

### Risk 4

Kapak ve export kalitesi satış vaadinin altında kalırsa landing ne kadar iyi olsa da retention düşer.

---

## 12. Önceliklendirilmiş Backlog

## P0

- `web/` runtime standardizasyonu
- `/app` error/loading/not-found ekranları
- backend unavailable fallback
- `/start` sayfası
- CTA akışının `/start` üzerinden yeniden kurgulanması

## P1

- app home first-run redesign
- examples sayfası
- pricing copy yeniden yazımı
- workspace sekme dilinin müşteri odaklı revizyonu
- event tracking

## P2

- gerçek auth planı
- plan bazlı entitlement sistemi
- onboarding e-posta akışları
- SEO odaklı use-case landing'ler
- gelişmiş örnek kütüphanesi

---

## 13. Fazlara Göre Teslim Çıktıları

| Faz | Çıktı |
|---|---|
| Faz 0 | stabil Next app, error boundaries, runtime standardı |
| Faz 1 | landing -> start -> app tek akışı |
| Faz 2 | yüksek dönüşümlü onboarding ve activation |
| Faz 3 | müşteri diline oturmuş workspace |
| Faz 4 | examples ve güven yüzeyi |
| Faz 5 | net pricing ve satış metinleri |
| Faz 6 | event tracking ve growth dashboard |

---

## 14. Başarı Tanımı

Bu planın başarılı sayılması için aşağıdaki sonuçlar hedeflenir:

### Teknik

- `/app` route crash oranı ciddi biçimde düşer
- kullanıcı kontrollü hata ekranı görür
- build/deploy standardı netleşir

### Ürün

- ilk kez gelen kullanıcı ilk adımı tereddütsüz atar
- wizard completion artar
- ilk export alma oranı yükselir

### Ticari

- landing -> start dönüşümü yükselir
- pricing -> signup dönüşümü iyileşir
- örnek çıktı gören kullanıcıların satın alma niyeti artar

---

## 15. Hemen Sonraki Uygulanabilir Adımlar

Bu belgeye göre önerilen gerçek uygulama sırası:

1. `web/` runtime ve build standardını çöz
2. `/app` için `error.tsx`, `loading.tsx`, `not-found.tsx` ekle
3. backend unavailable fallback ekranı tasarla
4. `/start` route'unu ekle
5. landing CTA'larını `/start` akışına taşı
6. app home first-run boş state'ini yeniden tasarla
7. `examples` sayfasını üret
8. pricing ve FAQ metinlerini yeni konumlandırmaya göre yeniden yaz
9. analytics event'lerini ekle
10. `dashboard/` legacy kullanım planını çıkar

---

## 16. Sonuç

Book Generator'ın şu anda ihtiyacı yalnızca "güzel bir sayfa" değildir. İhtiyaç duyulan şey:

- stabil bir ürün omurgası
- tek hikâye anlatan bir bilgi mimarisi
- dönüşüme odaklı onboarding
- güven veren örnek ve teslim yüzeyi
- operasyonel olarak ölçeklenebilir bir frontend kararı

Doğru sıra şudur:

`önce stabilizasyon -> sonra akış birliği -> sonra aktivasyon -> sonra agresif pazarlama`

Bu sıraya uyulursa ürün hem daha güvenilir görünür hem de satışa daha uygun hale gelir.
