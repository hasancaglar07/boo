# Wizard Page-by-Page Spec

## Amaç

Bu doküman, yeni kayıtsız kitap oluşturma akışının tüm ekranlarını tek tek tanımlar. Hedef, kullanıcıyı büyük ama sade bir arayüzle adım adım ilerletmek ve her kritik noktada AI yardımı görünür kılmaktır.

## Mevcut Durumdan Çıkış

Bugün `web/src/components/app/wizard-screen.tsx` içinde 5 kısa soru vardır:

- tür,
- konu,
- hedef kitle,
- dil,
- derinlik.

Bu yapı hızlı olsa da:

- başlık üretimi yok,
- alt başlık üretimi yok,
- outline düzenleme yok,
- kapak yönü kararı yok,
- signup ve preview funnel’ına göre optimize değil.

Yeni wizard bu eksikleri kapatacaktır.

## Global Wizard İlkeleri

### Deneyim İlkeleri

- Wizard lineer olacak.
- Her adımda tek ana karar grubu olacak.
- Copy kısa olacak.
- Büyük başlık + kısa yardımcı metin + tek ana CTA modeli kullanılacak.
- Her adım otomatik kaydedilecek.
- Kullanıcı geri döndüğünde aynı adımdan devam edecek.

### AI Yardım İlkeleri

Zorunlu AI butonları:

- `AI ile Başlık Üret`
- `AI ile Alt Başlık Üret`
- `AI ile Bölüm Planı Oluştur`
- `AI ile Outline İyileştir`
- `AI ile Stil Öner`

Kural:

- AI önerileri kullanıcıyı kilitlemez.
- Her öneri manuel düzenlenebilir.
- AI başarısız olursa kullanıcı akıştan düşmez.

### Dil ve İçerik Standardı

- Wizard dili Türkçe ise varsayılan generated UI kopyaları Türkçe olmalıdır.
- Kitap dili Türkçe seçilmişse outline ve chapter başlıklarında İngilizce jenerik etiket kalmamalıdır.
- `Chapter`, `Section`, `Introduction`, `Conclusion` gibi kelimeler dil normalize katmanından geçmelidir.

## Ortak Ekran Şablonu

Her wizard ekranı şu iskeleti kullanır:

1. Üstte step progress.
2. Ortada büyük başlık.
3. Altında kısa yardımcı metin.
4. Ana form alanı.
5. Gerekirse AI öneri alanı.
6. Altta `Geri` ve birincil CTA.
7. Yan/alt bölgede küçük özet kartı.

## Draft ve Autosave Davranışı

- Her alan değişiminde draft state güncellenir.
- İlk aşamada mevcut `preview-auth.ts` local storage yapısı geçici olarak kullanılabilir.
- Nihai mimaride bu state server-side guest draft ile eşlenir.
- Kullanıcı sayfayı kapatıp döndüğünde kaldığı adım açılır.

## Adım 1: `/start/topic`

### Ekran Amacı

Kitabın ne hakkında olduğunu ve kime yazıldığını netleştirmek.

### Büyük Başlık

`Nasıl bir kitap oluşturmak istiyorsun?`

### Yardımcı Metin

`Konuyu birkaç kelimeyle yaz. Geri kalanını birlikte netleştirelim.`

### Alanlar

- `Konu`
- `Kitap tipi`
- `Hedef okur`

### Alan Ayrıntıları

#### Konu

- zorunlu
- tek satır veya kısa textarea
- placeholder:
  - `örnek: Minecraft yeni başlayanlar rehberi`
  - `örnek: freelance tasarımcılar için müşteri bulma`

#### Kitap tipi

Önerilen seçenekler:

- Rehber
- Eğitim
- İş / profesyonel
- Çocuk
- Hikâye / yaratıcı
- Diğer

#### Hedef okur

Örnek seçenekler:

- Yeni başlayanlar
- Ebeveynler
- Öğretmenler
- Girişimciler
- Oyuncular
- Serbest çalışanlar
- Serbest giriş

### AI Butonları

- Bu adımda AI zorunlu değildir.
- Opsiyonel:
  - `Örnek Bir Konu Doldur`
  - `AI ile Konuyu Netleştir`

### Validasyon

- konu boş olamaz
- hedef okur boş geçilebilir ama önerilir
- kitap tipi default seçili gelir

### Varsayılanlar

- kitap tipi: `Rehber`
- dil: sistem locale veya son tercih

### İleri Davranışı

- konu doluysa `/start/title`

### Geri Davranışı

- public landing’e dönülebilir

### UX Notu

- Bu ekran en düşük bilişsel yük taşımalı.
- Kullanıcı ilk 15 saniyede ikinci adıma geçebilmelidir.

## Adım 2: `/start/title`

### Ekran Amacı

Kitabın başlığını ve alt başlığını güçlü hale getirmek.

### Büyük Başlık

`Kitabın adı ne olsun?`

### Yardımcı Metin

`İstersen başlığı sen yaz. İstersen AI birkaç güçlü seçenek oluştursun.`

### Alanlar

- `Başlık`
- `Alt başlık`

### AI Butonları

- `AI ile Başlık Üret`
- `AI ile Alt Başlık Üret`
- opsiyonel üçüncü aksiyon:
  - `10 Seçenek Daha`

### AI Çıktı Davranışı

- bir modal veya seçenek kartları alanında 3 ila 10 öneri döner
- kullanıcı tek tıkla uygular
- öneri seçildiğinde alan doldurulur ama kilitlenmez

### Validasyon

- başlık zorunlu
- alt başlık opsiyonel ama önerilir

### Varsayılanlar

- topic verisine göre ilk başlık önerisi otomatik gelebilir

### İleri Davranışı

- başlık doluysa `/start/outline`

### Geri Davranışı

- `/start/topic`

### Copy Örnekleri

- AI düğmesi alt metni:
  - `Daha vurucu bir başlık istiyorsan AI önersin.`

### İçerik Kalitesi Kuralı

- başlık ve alt başlık seçilen kitap diline uygun üretilir
- gereksiz İngilizce teknik kelime sızıntısı kalite hatasıdır

## Adım 3: `/start/outline`

### Ekran Amacı

Kitabın iskeletini görünür hale getirmek.

### Büyük Başlık

`Bölümler nasıl ilerlesin?`

### Yardımcı Metin

`Önce güçlü bir iskelet kuralım. Sonra kitap çok daha tutarlı çıkar.`

### Alanlar

- bölüm listesi
- bölüm başlığı
- bölüm kısa amacı

### Varsayılan Görünüm

- 5 ila 8 bölüm kartı
- sürükle-bırak veya yukarı-aşağı taşıma
- bölüm ekle / sil

### AI Butonları

- `AI ile Bölüm Planı Oluştur`
- `AI ile Outline İyileştir`
- opsiyonel:
  - `Daha Kısa Yap`
  - `Daha Detaylı Yap`

### Validasyon

- en az 3 bölüm
- her bölümde başlık bulunmalı

### Geri Davranışı

- `/start/title`

### İleri Davranışı

- `/start/style`

### Kalite Kuralı

- Dil Türkçe ise bölüm başlıkları Türkçe üretilecek.
- `Chapter 1`, `Chapter 2` gibi placeholder başlıklar kabul edilmeyecek.
- Eğer model bu tip başlık üretirse normalize edilip tekrar yazdırılacak veya UI uyarısı verilecek.

### UX Notları

- Bu ekran funnel’ın en kritik güven noktasıdır.
- Kullanıcı ilk kez “evet, burada gerçekten kitap oluşuyor” hissini burada alır.

## Adım 4: `/start/style`

### Ekran Amacı

Ton, uzunluk, dil ve görsel yönü belirlemek.

### Büyük Başlık

`Nasıl bir sonuç istiyorsun?`

### Yardımcı Metin

`Birkaç tercih yap. Yazım dili ve kapak yönü buna göre şekillensin.`

### Alanlar

- `Dil`
- `Ton`
- `Derinlik / uzunluk`
- `Kapak yönü`

### Önerilen Seçenekler

#### Dil

- Türkçe
- English

#### Ton

- Açık ve öğretici
- Profesyonel
- Samimi
- İlham verici

#### Derinlik

- Kısa ve hızlı
- Dengeli
- Daha detaylı

#### Kapak yönü

- Modern editoryal
- Cesur teknoloji
- Minimal profesyonel
- Genç ve enerjik

### AI Butonları

- `AI ile Stil Öner`
- `AI ile Kapak Yönü Öner`

### Validasyon

- dil zorunlu
- ton ve derinlik default seçili gelebilir

### Varsayılanlar

- dil: kullanıcının wizard’da seçtiği dil
- ton: kitap tipine göre öneri
- derinlik: `Dengeli`

### Geri Davranışı

- `/start/outline`

### İleri Davranışı

- `/start/generate`

### İçerik Kalitesi Kuralı

- Burada seçilen dil, sonraki tüm chapter üretim promptlarında zorunlu parametre olur.
- Sistem jenerik başlıklar ve bölüm etiketlerinde dil sızıntısını engeller.

## Adım 5: Review Bölümü

### Route Kararı

Ek bir `/start/review` route açılmayacaktır.

Sebep:

- funnel’ı gereksiz uzatmamak,
- generate ekranının üst bölümünde son kontrol özetini göstermek.

### Nerede Gösterilecek

- `/start/generate` ekranının ilk state’inde

### İçerik

- konu
- hedef okur
- başlık
- alt başlık
- bölüm sayısı
- dil
- ton
- kapak yönü

### Birincil CTA

- `Üretimi Başlat`

### İkincil CTA

- `Başlığı Düzenle`
- `Outline'ı Düzenle`

## Ortak Navigation Davranışı

- Kullanıcı her adımda geri gidebilir.
- İleri butonu yalnız minimum validasyon sağlandığında aktif olur.
- Kaydedilmemiş değişiklik kavramı olmayacak; her şey autosave olacak.

## Mobil Davranışı

- Progress tek satır yatay step yerine kısa durum etiketi olarak gösterilebilir.
- CTA her zaman ekranın alt kısmında erişilebilir olacak.
- Outline düzenleme mobilde kart tabanlı olacak.

## Hata Davranışı

- AI butonu hata verirse alanlar korunur.
- Otomatik öneri başarısızsa kullanıcı manuel devam eder.
- Ağ sorunu varsa draft yerel veya sunucu state’inde korunur.

## Uygulama Notları

Bu doküman, mevcut şu dosyaların yeniden ele alınmasını gerektirir:

- `web/src/components/app/wizard-screen.tsx`
- `web/src/lib/preview-auth.ts`
- `web/src/lib/dashboard-api.ts`
- yeni adım route’ları için `web/src/app/start/*`

## Son Karar

Wizard, ürünün kalbidir. Başarılı funnel için wizard:

- hızlı,
- sezgisel,
- AI destekli,
- dil açısından tutarlı,
- veri kaybetmeyen

bir yapıya dönüşmelidir.
