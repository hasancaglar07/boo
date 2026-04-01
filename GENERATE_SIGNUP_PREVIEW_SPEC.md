# Generate, Signup Bridge and Preview Spec

## Amaç

Bu doküman, wizard tamamlandıktan sonraki en kritik gelir akışını tanımlar:

`Generate -> Bekleme -> Signup Bridge -> Preview -> Upgrade`

Bu bölüm funnel’ın dönüşüm motorudur.

## Temel İlke

- Generate butonuna basıldığı an kullanıcı artık “emek vermiş” kabul edilir.
- Bu noktadan sonra hesap bağlatmak mantıklıdır.
- Fakat tam değeri göstermeden ödeme istemek erkendir.
- Bu nedenle sıralama:
  - önce üretim başlat,
  - sonra kısa signup,
  - sonra güçlü preview,
  - sonra premium.

## State Makinesi

Önerilen ana state’ler:

- `draft_ready`
- `job_starting`
- `job_running`
- `awaiting_signup`
- `signup_in_progress`
- `job_running_authenticated`
- `preview_ready`
- `preview_locked`
- `premium_unlocked`
- `generation_failed`

## `/start/generate` Ekranı

### Ekran Amacı

- kullanıcıya son kontrolü göstermek,
- generation job’ını başlatmak,
- üretim sırasında ilerleme hissi vermek,
- signup bridge’e geçirmek.

### İlk Ekran İçeriği

- küçük özet kartları
- başlık
- alt başlık
- bölüm sayısı
- dil
- ton
- kapak yönü

### Büyük Başlık

`Kitabını oluşturmaya hazırız`

### Yardımcı Metin

`Kapak, outline ve örnek bölümleri şimdi hazırlıyoruz.`

### CTA

- `Üretimi Başlat`

### İkincil Aksiyonlar

- `Başlığı Düzenle`
- `Outline'ı Düzenle`

## Job Başlatma Akışı

1. Draft son kez validate edilir.
2. Server-side guest draft kaydı oluşturulur veya güncellenir.
3. Generation job kuyruğa alınır.
4. Kullanıcıya progress state gösterilir.
5. Kısa bir gecikmeden sonra signup bridge açılır.

Not:

- signup modal olarak veya route geçişiyle açılabilir.
- Tercih edilen yöntem: route tabanlı continuation ekranı, çünkü daha güvenli ve izlenebilir.

## Progress Aşamaları

Kullanıcıya teknik olmayan, açık aşamalar gösterilir:

- `Kitap yapısı hazırlanıyor`
- `Başlık ve bölüm akışı netleştiriliyor`
- `İlk sayfalar yazılıyor`
- `Kapak görselleri oluşturuluyor`
- `Önizleme hazırlanıyor`

İsteğe bağlı alt metin:

- `Bu sırada hesabına bağlayalım; sonuç hazır olduğunda kaybolmasın.`

## Signup Bridge

### Neden Burada

Signup ilk ekranda değil burada istenir çünkü:

- kullanıcı ürün değerine yaklaşmıştır,
- emek harcamıştır,
- draft kaydetme ihtiyacı daha anlamlıdır.

### Konumlandırma

Başlık:

`Kitabını kaybetme`

Yardımcı metin:

`Hazırladığın kitabı hesabına bağlayalım. Önizleme hazır olduğunda burada seni bekliyor olacak.`

Kaçınılacak dil:

- `Üye ol`
- `Kayıt zorunlu`
- `Devam etmek için hesap aç`

Tercih edilen dil:

- `Devam etmek için bağla`
- `Sonucu hesabına kaydedelim`
- `Tekrar döndüğünde kitabın hazır olsun`

### Auth Seçenekleri

Birincil:

- `Google ile Devam Et`

İkincil:

- `E-posta ile Link Gönder`

Yardımcı:

- `Zaten hesabım var`

### UX Kuralları

- Tek ekranda biter.
- Uzun form olmaz.
- Şifre oluşturma ilk aşamada zorunlu olmaz.
- Magic link tercih edilir.

## Job-to-Account Merge

### Gereksinim

Guest draft ve guest job, signup tamamlandığında gerçek kullanıcı hesabına bağlanmalıdır.

### Kurallar

- Bir guest token yalnızca bir aktif draft ile eşlenir.
- Signup sonrası draft `user_id` ile işaretlenir.
- Duplicate kitap oluşturulmaz.
- Devam eden job iptal edilmez.
- Kullanıcı doğru preview ekranına yönlendirilir.

### Hata Durumu

- Merge başarısız olursa job yine tamamlanır; ama kullanıcıya tekrar bağlama seçeneği verilir.

## Preview Sayfası

Route:

- `/app/book/[id]/preview`

### Ekran Amacı

- gerçek değer göstermek,
- premium yükseltme için güven yaratmak.

### Sayfa Bileşenleri

- tam ön kapak
- tam arka kapak veya arka kapak özeti
- içindekiler
- `%20 manuscript preview`
- kilitli bölüm kartları
- premium CTA alanı

### Büyük Başlık

- kitabın başlığı doğrudan kullanılır

### Yardımcı Metin

`Önizleme hazır. Tam kitabı açmak ve PDF indirmek için premium'a geçebilirsin.`

### Preview Kuralları

- cover tam görünür
- outline tam görünür
- ilk `%20` içerik görünür
- kalan bölüm içerikleri tam metin olarak dönmez
- kalan bölümler kilitli kart, blur veya kısa teaser ile gösterilir

### Kilitli Bölüm Yapısı

Her kilitli bölüm için:

- bölüm adı
- 1 cümlelik özet veya hook
- kilit ikonu
- `Tam kitabı aç`

### İçerik Güvenliği

- istemciye free kullanıcı için full manuscript JSON gönderilmez
- preview response yalnız izinli metin dilimini içerir

## Upsell Noktaları

Birincil ticari anlar:

- `PDF İndir`
- `EPUB İndir`
- `Tam Kitabı Aç`
- `Tam Düzenlemeyi Aç`

Kurallar:

- free / registered non-premium kullanıcı bu aksiyonlara bastığında paywall açılır
- premium kullanıcı doğrudan ilgili aksiyonu alır

## Paywall Tetikleme Davranışı

### Soft Paywall

Tetikleyici:

- kilitli bölüm kartına basmak

Mesaj:

- `Kalan bölümleri açmak için premium'a geç`

### Export Paywall

Tetikleyici:

- `PDF İndir`
- `EPUB İndir`

Mesaj:

- `PDF ve EPUB export premium planla açılır`

### Editing Paywall

Tetikleyici:

- `Tam Düzenlemeyi Aç`

Mesaj:

- `Tam düzenleme ve export araçları premium kullanıcılar içindir`

## Ödeme Sonrası Dönüş Akışı

1. Kullanıcı checkout’a gider.
2. Ödeme başarılı olursa `checkout success` route’una düşer.
3. Buradan ilgili kitaba geri döndürülür.
4. Preview sayfası refresh edilir.
5. Kilitli içerik ve export aksiyonları açılır.

### Success Sonrası CTA

- `PDF'i İndir`
- `Tam Kitabı Aç`

### Cancel Sonrası CTA

- `Önizlemeye Dön`
- `Daha Sonra Karar Ver`

## Premium Unlock Sonrası Davranış

- Full manuscript erişimi açılır.
- PDF/EPUB export başlatılabilir.
- Düzenleme sekmeleri görünür hale gelir.
- Library kartında premium rozet görünür.

## Error States

### Job Başlatılamadı

- kullanıcı `/start/style` veya generate özetine döner
- retry butonu gösterilir

### Signup Başarısız

- progress kaybolmaz
- kullanıcı tekrar deneyebilir

### Preview Hazırlanamadı

- generation status devam ediyor olarak gösterilir
- manuel yenileme ve polling çalışır

### Backend Ulaşılamıyor

- kullanıcının draft verisi korunur
- güvenli retry copy’si gösterilir

## Uygulama Notları

Bu doküman doğrudan şu mevcut katmanların evrilmesini gerektirir:

- `web/src/components/app/wizard-screen.tsx`
- `web/src/components/app/workspace-screen.tsx`
- `web/src/lib/preview-auth.ts`
- `web/src/lib/dashboard-api.ts`
- `dashboard_server.py`

## Son Karar

Generate sonrası signup, ürünün dönüşüm omurgasıdır. Bu yapı doğru kurulursa:

- ilk deneyim hızlanır,
- signup daha doğal olur,
- premium teklif daha inandırıcı hale gelir.
