# Paywall, Billing and Access Rules

## Amaç

Bu doküman, hangi kullanıcı tipinin hangi içeriğe erişeceğini, premium’un tam olarak ne açacağını ve ödeme akışının nasıl işleyeceğini netleştirir.

## Temel Karar

Ücretsiz vaat:

- wizard,
- AI yardımlı başlık/outline oluşturma,
- generate,
- kapak,
- outline,
- ilk `%20` preview.

Premium vaat:

- full manuscript,
- PDF,
- EPUB,
- tam düzenleme,
- tam export deneyimi.

## Kullanıcı Türleri

| Kullanıcı türü | Açıklama |
| --- | --- |
| Visitor | Siteyi gezen, henüz wizard’a başlamamış kişi |
| Guest Builder | Wizard kullanan ama hesap açmamış kişi |
| Registered User | Hesabı olan ama ödeme yapmamış kullanıcı |
| Premium User | Ödeme yapmış kullanıcı |

## Yetki Matrisi

| Özellik | Visitor | Guest Builder | Registered | Premium |
| --- | --- | --- | --- | --- |
| Landing / public içerik | Evet | Evet | Evet | Evet |
| Wizard başlatma | Evet | Evet | Evet | Evet |
| AI ile başlık önerisi | Evet | Evet | Evet | Evet |
| AI ile outline önerisi | Evet | Evet | Evet | Evet |
| Generate başlatma | Hayır | Evet | Evet | Evet |
| Signup sonrası preview görme | Hayır | Hayır | Evet | Evet |
| Kapak görme | Hayır | Hayır | Evet | Evet |
| Outline tam görme | Hayır | Hayır | Evet | Evet |
| İlk %20 metin | Hayır | Hayır | Evet | Evet |
| Full manuscript | Hayır | Hayır | Hayır | Evet |
| PDF export | Hayır | Hayır | Hayır | Evet |
| EPUB export | Hayır | Hayır | Hayır | Evet |
| Tam düzenleme | Hayır | Hayır | Hayır | Evet |

Not:

- Guest Builder generation başlatabilir; ancak preview görmek için signup gerekir.
- Bu sayede ürün “önce değer, sonra hesap” mantığını korur.

## Free Kullanıcı İçin Kural Seti

- Kitap üretilebilir.
- Ancak kitap account’a bağlanmadan kalıcı deneyim sunulmaz.
- Signup sonrası preview açılır.
- Preview yalnız `%20` içerik döner.
- Download, export ve tam erişim kapalıdır.

## Registered Non-Premium Kullanıcı İçin Kural Seti

- Kütüphanede kitaplarını görür.
- Preview’a tekrar dönebilir.
- Kapak ve outline’ı görebilir.
- Full manuscript’e erişemez.
- PDF ve EPUB export yapamaz.
- Tam düzenleme araçları kapalıdır.

## Premium Kullanıcı İçin Kural Seti

- Full manuscript’i açar.
- PDF export alır.
- EPUB export alır.
- Tam düzenleme alanlarını açar.
- İleride farklı kalite seviyeleri eklenirse üst planlara genişletilebilir.

## Full Content Neden Client’a Dönmez

Tam içerik ücretsiz kullanıcının istemcisine gönderilirse:

- network response’tan alınabilir,
- preview kilidi anlamsızlaşır,
- maliyetli içerik ücretsiz sızdırılmış olur.

Bu nedenle:

- full manuscript yalnız server-side saklanır,
- preview response kırpılmış şekilde oluşturulur,
- frontend yalnız izinli preview metnini render eder.

## Preview Erişim Kuralı

Varsayılan preview oranı:

- `%20`

Ek kurallar:

- minimum 1 anlamlı bölüm parçası gösterilecek,
- ancak hiçbir durumda kitabın çoğunluğu açık edilmeyecek,
- kilitli kısım görsel olarak çekici ama veri açısından kapalı olacak.

## Paywall Varyantları

### 1. Soft Paywall

Ne zaman:

- kullanıcı kilitli bölüme tıkladığında.

Mesaj:

- `Kalan bölümleri açmak için premium'a geç.`

### 2. Export Paywall

Ne zaman:

- kullanıcı `PDF İndir` veya `EPUB İndir` tıkladığında.

Mesaj:

- `PDF ve EPUB export premium planda açılır.`

### 3. Full Unlock Paywall

Ne zaman:

- kullanıcı `Tam Kitabı Aç` tıkladığında.

Mesaj:

- `Tüm bölümleri ve tam düzenleme araçlarını premium ile aç.`

## Premium CTA Copy Rehberi

Tercih edilen CTA’lar:

- `Premium'a Geç`
- `Tam Kitabı Aç`
- `PDF ve EPUB'u İndir`
- `Yazım Alanını Aç`

Kaçınılacak CTA’lar:

- `Satın Al`
- `Devam etmek için öde`
- `Kilit aç`

Gerekçe:

- kullanıcıya yalnız para talebi gibi görünmemeli,
- fayda odaklı sonuç dili kullanılmalı.

## Stripe Checkout Akışı

### Varsayılan Karar

- İlk çıkışta tek premium plan kullanılacak.
- Stripe Checkout hosted flow tercih edilecek.

### Akış

1. Kullanıcı preview veya paywall üstünden upgrade CTA’ya basar.
2. Sistem kitap ve kullanıcı bağlamıyla checkout session oluşturur.
3. Kullanıcı Stripe sayfasına gider.
4. Başarı halinde `/checkout/success` ekranına döner.
5. Sistem premium yetkisini günceller.
6. Kullanıcı ilgili kitaba geri döner.

### Checkout Success

Gösterilecekler:

- başarı mesajı,
- kitap başlığı,
- `PDF'i İndir`,
- `Tam Kitabı Aç`

### Checkout Cancel

Gösterilecekler:

- `Önizleme hâlâ hazır`
- `Daha sonra devam edebilirsin`
- `Önizlemeye Dön`

## Billing Ayar Ekranı

Route:

- `/app/settings/billing`

Gösterecekleri:

- mevcut plan,
- yenileme tarihi,
- fatura geçmişi,
- ödeme yöntemi yönetimi,
- iptal / plan değişikliği

İlk release kararı:

- kompleks plan tabloları yerine sade tek premium plan.

## İade, İptal ve Retry

### İptal

- dönem sonuna kadar erişim korunabilir.

### Ödeme Hatası

- kullanıcı aynı checkout’a tekrar dönebilir.

### İade

- manuel destek süreciyle başlayabilir; sonra otomatik kurallara genişletilir.

## Endpoint Guard Kuralları

Bu doküman, backend’de aşağıdaki sınıflandırmayı gerektirir:

- Public endpoints:
  - landing verileri,
  - örnek içerikler,
  - wizard yardımcı aksiyonları
- Registered endpoints:
  - preview metadata,
  - library,
  - own book status
- Premium-only endpoints:
  - full manuscript,
  - export start,
  - export download,
  - tam edit data

## İndirme Davranışı

### Free / Registered

- `PDF İndir` butonu görünür olabilir,
- fakat tıklanınca paywall açar.

### Premium

- `PDF İndir` doğrudan export job veya dosya indirmesine gider.

## İlk Release İçin Karar

- Çok planlı billing ertelenecek.
- Tek premium plan ile çıkılacak.
- İlk hedef, friction azaltmak ve dönüşüm ölçmek olacak.

## Son Karar

Paywall ürünün içine sonradan eklenen bir duvar gibi değil, preview deneyiminin doğal devamı gibi çalışmalıdır.

Kullanıcının gördüğü mesaj şu olmalıdır:

> Önizleme hazır. Şimdi tam kitabı aç.
