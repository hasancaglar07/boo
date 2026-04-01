# Design System and UI Principles

## Amaç

Bu doküman, yeni funnel ve uygulama yüzeyinin görsel ve etkileşim ilkelerini tanımlar. Hedef; kalabalık dashboard görünümünden çıkıp, yayıncılık odaklı premium bir ürün hissi yaratmaktır.

## Ürün Hissi

Hedef algı:

- `guided studio`
- `premium publishing tool`
- `hızlı ama ciddi`
- `editorial ama modern`

Kullanıcı hissetmeli ki:

- ürün ne yapıyor belli,
- bir sonraki adım belli,
- görsel kalite yüksek,
- ama arayüz yorucu değil.

## Mevcut Tasarım Gerçeği

Bugünkü `web/src/app/globals.css` şu temel yönü kurmuş durumda:

- sıcak editorial zemin,
- `Lora` serif kullanımı,
- sıcak turuncu ana vurgu,
- ferah yüzeyler.

Karar:

- bu temel yön korunacak,
- ama yeni funnel’da daha net hiyerarşi ve daha az uygulama kalabalığıyla güçlendirilecek.

## Temel Tasarım İlkeleri

### 1. Büyük Başlık

- Her ana ekranda güçlü bir başlık olacak.
- H1’ler kısa ve etkili olacak.
- Kullanıcı ekrana bakınca hemen ne yaptığı anlayacak.

### 2. Kısa Yardımcı Metin

- Uzun paragraf kullanılmayacak.
- Tek cümlelik açıklama yeterli olacak.

### 3. Tek Ana CTA

- Her ekranda bir birincil aksiyon olacak.
- İkincil aksiyon varsa görsel olarak daha geri planda duracak.

### 4. Ferah Spacing

- Ekranlar sıkışık görünmeyecek.
- Wizard ve preview ekranlarında yatay boşluk cömert olacak.

### 5. Step-Based Progress

- Kullanıcı nerede olduğunu her an anlayacak.
- Progress bar veya step etiketi yönlendirici olacak.

## Sayfa Türleri

### Landing Sayfası

İçerik blokları:

- hero
- güven veren örnekler
- nasıl çalışır
- örnek kitaplar
- fiyat / SSS
- alt CTA

Yasaklar:

- küçük yoğun feature grid
- çok sayıda eşit ağırlıklı CTA
- hero altında karmaşık ürün açıklamaları

### Wizard Shell

Bileşenler:

- sol veya üst step indicator
- ana içerik alanı
- küçük özet paneli
- alt CTA satırı

Hedef:

- panel hissi değil, ilerleyen bir yolculuk hissi.

### Generate Ekranı

Boş spinner yasak.

Olması gerekenler:

- aşama başlıkları
- progress hissi
- güven veren kısa açıklama
- signup bridge geçişi

### Preview Ekranı

Bileşenler:

- büyük kapak gösterimi
- kitabın kimliği
- içindekiler
- okunan preview blokları
- kilitli kartlar
- güçlü premium alanı

## Bileşen Kataloğu

### Hero

Kullanım:

- public landing

Özellikler:

- çok büyük başlık
- kısa alt metin
- tek ana CTA
- güçlü örnek görsel veya kitap mockup alanı

### Wizard Step Header

İçerik:

- adım etiketi
- büyük başlık
- kısa açıklama

### Progress Bar

Kurallar:

- sayısal değil, anlamlı adım isimleri tercih edilir
- mobilde sadeleştirilmiş görünüm kullanılabilir

### AI Suggestion Panel

Kullanım:

- başlık
- alt başlık
- outline
- stil önerileri

Özellikler:

- öneriler kart veya liste halinde
- tek tıkla uygula
- manuel düzenlemeyi kapatmaz

### Preview Lock Cards

Kullanım:

- görünmeyen bölümlerin yerine

Özellikler:

- bölüm adı
- kısa teaser
- kilit ikonu
- premium CTA

### Paywall Modal / Section

Kullanım:

- preview ve export anları

Özellikler:

- tek güçlü fayda listesi
- kısa copy
- karmaşık fiyat tablosu yok

### Example Book Cards

Kullanım:

- landing,
- examples sayfası

Özellikler:

- ön kapak
- kısa tür etiketi
- bir satırlık değer özeti

## Renk Sistemi

Temel yön, mevcut global token’lara yaslanmalıdır:

- ana vurgu: sıcak turuncu / bakır
- zemin: kırık beyaz / editorial krem
- vurgu yüzeyleri: yumuşak sıcak gri-bej
- metin: koyu sıcak kahverengi-gri

Karar:

- premium hissi koyu siyah değil, sıcak editoryal tonlarla kurulacak.

## Tipografi Sistemi

### Başlıklar

- serif karakter kullanılabilir
- mevcut `Lora` yönü korunabilir
- büyük boyutlar:
  - hero
  - section
  - card

### Gövde Metni

- sade sans
- kısa satır uzunluğu
- rahat satır aralığı

### Hiyerarşi

- H1: değer teklifi
- H2: bölüm başlıkları
- H3: kart ve alt blok başlıkları

## Buton Hiyerarşisi

### Primary

- tam dolu, net vurgu
- sayfa başına en fazla bir tane baskın primary

### Secondary

- outline veya yumuşak yüzey
- geri, örnek gör, düzenle

### Ghost / Link

- küçük yardımcı eylemler
- asla primary ile yarışmaz

## Form Alanı Davranışı

- büyük tıklama alanları
- rahat padding
- mobilde kolay dokunma
- validasyon hataları kısa ve net
- placeholder örnekleri faydalı ama baskın olmayacak

## Loading State Davranışı

- skeleton + süreç aşaması
- kullanıcıyı boşlukta bırakmayan copy
- progress dili teknik değil sonuç odaklı

## Empty State Davranışı

- her empty state bir sonraki adımı göstermeli
- özellikle library boşsa kullanıcı wizard’a dönmeli

## Error State Davranışı

- teknik stack trace veya kaba hata metni yok
- kullanıcıya ne olduğunu kısaca açıkla
- her hatada bir sonraki güvenli aksiyonu ver

Örnek:

- `Bağlantı kurulamadı. Kaldığın yer korunuyor. Tekrar dene.`

## Mobil Davranışları

- CTA alt kısımda kolay erişilir olacak
- wizard tek kolon olacak
- preview kartları dikey akacak
- paywall modal tam ekran sheet’e dönebilir

## Görsel Stil Yönü

Hedef:

- sıradan SaaS değil,
- kitap ve yayıncılık hissi veren,
- ama çağdaş ve dijital kalan

bir görünüm.

Kapaklar ve örnek kitap kartları gerçek ürün kalitesini yansıtmalı.

## Kaçınılacak Şeyler

- küçük yoğun paneller
- dashboard kalabalığı
- sol menüye aşırı yüklenme
- uzun açıklama blokları
- 5 farklı CTA’nın aynı ağırlıkta görünmesi
- spinner odaklı loading ekranları
- karışık ikon/etiket kümeleri

## Uygulama Referansları

Bu tasarım ilkeleri şu mevcut yapıları evriltir:

- `web/src/app/globals.css`
- `web/src/app/layout.tsx`
- `web/src/components/app/app-frame.tsx`
- `web/src/components/app/wizard-screen.tsx`
- `web/src/components/app/workspace-screen.tsx`

## Son Karar

Tasarımın görevi yalnızca “güzel görünmek” değildir. Tasarım:

- kullanıcının ne yapacağını gösterir,
- güven üretir,
- değeri görünür kılar,
- ödeme anını daha doğal hale getirir.
