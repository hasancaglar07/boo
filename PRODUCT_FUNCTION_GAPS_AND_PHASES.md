# Product Function Gaps And Phases

Bu doküman ürünün mevcut durumunu üç seviyede ayırır:

- `Hazır`: Kullanıcıya gösterilebilir ve akış içinde çalışır.
- `Kısmi`: Çalışır ama ticari kalite veya kalıcılık açısından eksikleri vardır.
- `Eksik`: Henüz gerçek ürün seviyesiyle tamamlanmamıştır.

## Hazır

- Kayıtsız wizard akışı
- Başlık, outline ve stil oluşturma
- Preview ekranı ve kilitli içerik mantığı
- Premium upgrade ekranı
- Yazar adı, imprint, wordmark, logo URL, biyografi ve kapak vurgusu alanları
- Preview ve upgrade ekranlarında kitap mockup sunumu
- Workspace içinde metadata düzenleme
- Çoklu provider fallback hattı
- Kapak kalite kapısı ve barkodlu arka kapak akışı

## Kısmi

- Generate aşaması
  Şu an kullanıcı deneyimi iyi, ama gerçek background queue/job sistemi değil.

- Auth
  Preview/session mantığı çalışıyor, ama production-grade gerçek auth modeli değil.

- Billing
  Plan yükseltme deneyimi var, ama gerçek Stripe checkout + webhook + entitlement akışı değil.

- Branding
  Wordmark ve logo URL var, ama gerçek dosya upload / medya kütüphanesi yok.

- Mockup sistemi
  Preview ve upgrade için güçlü mockup var, ama çoklu mockup varyantı yok.

- Metadata kalıcılığı
  Yazar/branding metadata’sı artık backend’de tutuluyor; yine de bunun için ayrı bir güçlü admin/metadata ekranı yok.

## Eksik

- Gerçek Stripe ödeme sistemi
- Webhook sonrası entitlement doğrulama
- Guest draft -> user merge için gerçek backend session modeli
- Export endpoint’lerinde tam plan bazlı server authorization denetimi
- Logo ve görsel upload alanı
- Kapak varyant galerisi
- Arka kapak editörü
- Seri bilgisi, kategori, imprint profilleri, ISBN havuzu
- Kullanıcı başına medya/kitap yönetim paneli
- Analitik dashboard ve conversion raporları

## Öncelikli Sonraki Fazlar

### Faz 1

- Gerçek ödeme akışı
- Gerçek entitlement guard
- Upgrade ekranından checkout dönüşü

### Faz 2

- Logo upload
- Medya kütüphanesi
- Kapak varyant seçici

### Faz 3

- Background generation jobs
- Retry ve queue görünürlüğü
- Job geçmişi

### Faz 4

- Gerçek auth
- Guest draft merge
- Kullanıcı bazlı kitap/asset sahipliği

### Faz 5

- Admin kalite paneli
- Funnel conversion ölçümü
- Ödeme ekranı A/B testleri
