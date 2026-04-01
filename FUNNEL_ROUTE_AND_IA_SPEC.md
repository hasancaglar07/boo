# Funnel Route and Information Architecture Spec

## Amaç

Bu doküman yeni funnel’ın route yapısını, sayfa sorumluluklarını, CTA geçişlerini ve legacy yönlendirme kurallarını netleştirir.

## Mevcut Durum

Repo içinde bugün görülen ana route yüzeyleri:

- Public:
  - `/`
  - `/examples`
  - `/pricing`
  - `/faq`
  - `/how-it-works`
  - `/start`
- Auth / account:
  - `/login`
  - `/register`
  - `/account`
  - `/billing`
- App:
  - `/app`
  - `/app/new`
  - `/app/book/[slug]`

Hedef mimari, bu mevcut yüzeyi tamamen silmek yerine yeniden düzenler.

## Bilgi Mimarisi Kararı

### Public Katman

Amaç:

- trafiği toplamak,
- güven oluşturmak,
- kullanıcıyı friction olmadan wizard’a sokmak.

Route’lar:

- `/`
- `/examples`
- `/pricing`
- `/faq`
- `/start`

### Wizard Katmanı

Amaç:

- ilk kitabı kayıt gerektirmeden başlatmak,
- kullanıcının ürün değerini hızla görmesini sağlamak.

Route’lar:

- `/start/topic`
- `/start/title`
- `/start/outline`
- `/start/style`
- `/start/generate`

### Auth Bridge Katmanı

Amaç:

- generation başladıktan sonra kullanıcıyı hesabına bağlamak.

Route’lar:

- `/signup/continue`
- `/login/continue`

### Product Katmanı

Amaç:

- kitapları yönetmek,
- preview göstermek,
- premiuma taşımak,
- export sunmak.

Route’lar:

- `/app/library`
- `/app/book/[id]/preview`
- `/app/book/[id]/upgrade`
- `/app/settings/billing`

## Global Geçiş Kuralı

- İlk CTA her zaman `/start/topic`’e gider.
- `/app` artık ilk temas noktası olmayacaktır.
- Giriş yapmış kullanıcı `/app` açarsa varsayılan hedef `/app/library` olacaktır.
- Giriş yapmamış kullanıcı `/app` açarsa funnel amacına göre `/start/topic` veya uygun onboarding ekranına yönlendirilir.

## Route Spesifikasyonları

### `/`

Amaç:

- ürünün ne yaptığını 5 saniyede anlatmak,
- ana CTA ile wizard’a yönlendirmek.

Hedef kullanıcı:

- ilk kez gelen ziyaretçi,
- reklam veya organik trafikten gelen kullanıcı.

Giriş koşulu:

- herkese açık.

Çıkış koşulu:

- kullanıcı CTA’ya tıklar ve `/start/topic`’e gider.

Ana CTA:

- `Hemen Başla`

İkincil CTA:

- `Örnekleri Gör`

Boş durum:

- yok.

Hata durumu:

- sayfa asla kritik veri beklememeli; statik render veya güvenli fallback kullanılmalı.

Not:

- hero dışındaki tüm CTA’lar da mümkün olduğunca aynı başlangıç route’una bağlanmalıdır.

### `/examples`

Amaç:

- örnek kapak, outline, preview ve final çıktı güveni vermek.

Hedef kullanıcı:

- karar verme aşamasındaki ziyaretçi.

Giriş koşulu:

- herkese açık.

Çıkış koşulu:

- kullanıcı `/start/topic`’e geçer.

Ana CTA:

- `Ben de Oluştur`

İkincil CTA:

- `Fiyatları Gör`

Boş durum:

- örnek içerik yüklenemiyorsa curated statik örnek gösterilir.

Hata durumu:

- dinamik kitap datası gelmiyorsa statik fallback kartlar sunulur.

### `/pricing`

Amaç:

- premiumun ne açtığını net göstermek,
- ama ilk temasta signup zorlamamak.

Hedef kullanıcı:

- ödeme eşiğine yakın ziyaretçi,
- preview gördükten sonra geri gelen kullanıcı.

Giriş koşulu:

- herkese açık.

Çıkış koşulu:

- kullanıcı ya wizard’a başlar ya da checkout akışına gider.

Ana CTA:

- `İlk Önizlemeni Oluştur`

İkincil CTA:

- `Premium'u Gör`

Boş durum:

- plan verisi yüklenemiyorsa tek premium plan fallback kartı gösterilir.

Hata durumu:

- ödeme servisinde sorun varsa kullanıcı wizard’a ve örneklere yönlendirilir.

### `/faq`

Amaç:

- itirazları azaltmak.

Hedef kullanıcı:

- güvensiz veya tereddütlü kullanıcı.

Giriş koşulu:

- herkese açık.

Çıkış koşulu:

- kullanıcı wizard’a gider.

Ana CTA:

- `Hemen Başla`

İkincil CTA:

- `Örnek Kitapları İncele`

Boş durum:

- yok.

Hata durumu:

- yok.

### `/start`

Amaç:

- yalnızca bir karar ekranı değil; funnel gateway olarak davranmak.

Karar:

- `/start` doğrudan tam wizard shell’e açılabilir veya otomatik olarak `/start/topic`’e yönlendirebilir.
- Tercih edilen davranış: redirect to `/start/topic`.

### `/start/topic`

Amaç:

- kitabın temel yönünü toplamak.

Hedef kullanıcı:

- guest builder.

Giriş koşulu:

- yeni draft başlatılmış olmalı veya otomatik başlatılmalı.

Çıkış koşulu:

- minimum alanlar doldurulup `/start/title`’a geçilir.

Ana CTA:

- `Devam Et`

İkincil CTA:

- `Örnek Bir Konuyla Doldur`

Boş durum:

- yeni draft oluşturulur.

Hata durumu:

- draft oluşturulamazsa yerel geçici state ile devam edilir, kullanıcı bloklanmaz.

### `/start/title`

Amaç:

- başlık ve alt başlığı netleştirmek.

Hedef kullanıcı:

- guest builder.

Giriş koşulu:

- topic adımı tamamlanmış olmalı.

Çıkış koşulu:

- başlık alanı dolu olmalı.

Ana CTA:

- `Bölümleri Oluştur`

İkincil CTA:

- `AI ile Başlık Üret`

Boş durum:

- topic verisine göre başlık önerisi hazırlanır.

Hata durumu:

- AI öneri başarısız olursa kullanıcı manuel düzenlemeye devam eder.

### `/start/outline`

Amaç:

- kitabın bölüm planını netleştirmek.

Hedef kullanıcı:

- guest builder.

Giriş koşulu:

- topic ve title adımları tamamlanmış olmalı.

Çıkış koşulu:

- en az 3 bölüm bulunmalı.

Ana CTA:

- `Stili Seç`

İkincil CTA:

- `AI ile Outline Oluştur`

Boş durum:

- AI ile önerilen outline default olarak yüklenebilir.

Hata durumu:

- outline üretilemezse template outline fallback’i sunulur.

### `/start/style`

Amaç:

- ton, uzunluk, dil ve kapak yönünü toplamak.

Hedef kullanıcı:

- guest builder.

Giriş koşulu:

- outline tamamlanmış olmalı.

Çıkış koşulu:

- generate için gerekli minimum ayarlar seçilmiş olmalı.

Ana CTA:

- `Kitabı Oluştur`

İkincil CTA:

- `AI ile Stil Öner`

Boş durum:

- varsayılan üretim profili yüklü gelir.

Hata durumu:

- stil önerisi başarısızsa varsayılan değerlerle devam edilir.

### `/start/generate`

Amaç:

- job başlatmak,
- progress göstermek,
- signup bridge’i doğru anda sunmak.

Hedef kullanıcı:

- guest builder,
- signup bekleyen kullanıcı.

Giriş koşulu:

- tüm wizard zorunlu alanları tamamlanmış olmalı.

Çıkış koşulu:

- signup tamamlanır,
- job biter,
- kullanıcı preview’a düşer.

Ana CTA:

- initial state: `Üretimi Başlat`
- signup state: `Google ile Devam Et`
- completion state: `Önizlemeyi Aç`

İkincil CTA:

- `E-posta ile Devam Et`

Boş durum:

- progress ekranı varsayılan skeleton ve aşama listesi gösterir.

Hata durumu:

- job hatası varsa retry ve geri dön seçenekleri sunulur.

### `/signup/continue`

Amaç:

- kullanıcıyı kitabını kaybetmeden hesabına bağlamak.

Hedef kullanıcı:

- generation sürecindeki guest kullanıcı.

Giriş koşulu:

- aktif guest draft veya aktif generation job bulunmalı.

Çıkış koşulu:

- signup tamamlanır,
- job mevcut kullanıcı hesabına bağlanır.

Ana CTA:

- `Google ile Devam Et`

İkincil CTA:

- `Magic Link Gönder`

Boş durum:

- job bulunamazsa kullanıcı `/start/topic`’e yönlendirilir ve açıklayıcı bilgi verilir.

Hata durumu:

- auth başarısızsa aynı sayfada tekrar deneme yapılır.

### `/login/continue`

Amaç:

- daha önce hesabı olan kullanıcıyı generation job’ına yeniden bağlamak.

Hedef kullanıcı:

- geri dönen kullanıcı.

Giriş koşulu:

- continuation token veya guest draft referansı bulunmalı.

Çıkış koşulu:

- kullanıcı preview’a ya da progress ekranına geri döner.

Ana CTA:

- `Giriş Yap ve Devam Et`

İkincil CTA:

- `Yeni Hesap Oluştur`

Boş durum:

- continuation token yoksa `/start/topic`’e yönlendir.

Hata durumu:

- login hatası sayfa içinde açıklanır.

### `/app/library`

Amaç:

- giriş yapmış kullanıcının kitaplarını sade şekilde göstermek.

Hedef kullanıcı:

- registered ve premium kullanıcı.

Giriş koşulu:

- auth gerekir.

Çıkış koşulu:

- kullanıcı belirli bir kitabın preview/workspace ekranına gider veya yeni wizard başlatır.

Ana CTA:

- `Yeni Kitap Oluştur`

İkincil CTA:

- kart bazında `Önizlemeyi Aç`

Boş durum:

- kullanıcıyı doğrudan `/start/topic` akışına yönlendiren empty state.

Hata durumu:

- backend ulaşılmazsa son bilinen local cache ve retry gösterilir.

### `/app/book/[id]/preview`

Amaç:

- kapağı, içindekileri ve ilk `%20` metni göstermek,
- premium dönüşümü tetiklemek.

Hedef kullanıcı:

- registered non-premium,
- premium user.

Giriş koşulu:

- auth gerekir.
- ilgili kitap mevcut olmalı.

Çıkış koşulu:

- kullanıcı upgrade yapar,
- export alır,
- kütüphaneye döner.

Ana CTA:

- free için `PDF İndir`
- premium için `PDF İndir`

İkincil CTA:

- free için `Tam Kitabı Aç`
- premium için `EPUB İndir`

Boş durum:

- kitap üretimi sürüyorsa progress görünümü açılır.

Hata durumu:

- preview verisi hazır değilse retry/polling sürer.

### `/app/book/[id]/upgrade`

Amaç:

- premium teklifini net ve temiz biçimde göstermek.

Hedef kullanıcı:

- registered non-premium.

Giriş koşulu:

- auth gerekir.

Çıkış koşulu:

- checkout başlar veya kullanıcı preview’a döner.

Ana CTA:

- `Premium'a Geç`

İkincil CTA:

- `Önizlemeye Dön`

Boş durum:

- plan verisi yoksa tek plan fallback’i göster.

Hata durumu:

- ödeme servis hatasında kullanıcı bilgili şekilde geri döner.

### `/app/settings/billing`

Amaç:

- plan durumu, fatura, ödeme yöntemi ve iptal akışını yönetmek.

Hedef kullanıcı:

- registered ve premium.

Giriş koşulu:

- auth gerekir.

Çıkış koşulu:

- kullanıcı planını değiştirir veya library’ye döner.

Ana CTA:

- free için `Premium'a Geç`
- premium için `Planı Yönet`

İkincil CTA:

- `Kitaplarıma Dön`

Boş durum:

- fatura yoksa temiz empty state göster.

Hata durumu:

- billing portal açılamazsa support fallback göster.

## Legacy Route Yönlendirme Kuralları

### `/app`

- Giriş yapmamış kullanıcı:
  - hedef: `/start/topic`
- Giriş yapmış kullanıcı:
  - hedef: `/app/library`

### `/app/new`

- Yeni funnel’da karşılığı `/start/topic` olacaktır.
- Eski linkler kırılmamalı; redirect ile yeni akışa taşınmalıdır.

### `/app/book/[slug]`

- Yeni varsayılan görünüm `/app/book/[id]/preview` olacaktır.
- Premium kullanıcı için ilgili detay sekmeleri korunabilir; ancak ilk açılış preview odaklı olmalıdır.

### `/login` ve `/register`

- SEO/public girişler için sayfalar korunabilir.
- Fakat yeni funnel içinde birincil auth yolu `/signup/continue` ve `/login/continue` olacaktır.

## Navigasyon Kararı

### Public Nav

- `Nasıl Çalışır`
- `Örnekler`
- `Fiyatlar`
- `SSS`
- `Hemen Başla`

### App Nav

- `Kitaplarım`
- `Yeni Kitap`
- `Faturalama`

Karar:

- mevcut `Ayarlar` ve ağır yan menü görünümü azaltılmalı.
- uygulama içi navigasyon yönetim değil sonuç odaklı olmalı.

## URL ve Kimlik Stratejisi

- Guest draft için kullanıcıya route seviyesinde teknik id gösterilmez.
- Kitap objeleri için kalıcı slug/id sunulur.
- Preview route’unda `[id]` hem slug hem UUID destekleyebilir; tercih edilen yöntem immutable internal id + readable slug eşlemesidir.

## Hata ve Kurtarma Politikası

- Route kırılırsa kullanıcı “This page couldn’t load” gibi genel hata görmemeli.
- Public route’larda güvenli fallback ve CTA gösterilmeli.
- Wizard route’larında autosave sayesinde veri kaybı yaşanmamalı.
- Generate sırasında job hatası olursa kullanıcı outline ve ayarlara geri dönebilmeli.

## Son Karar

Yeni bilgi mimarisi tek bir ana ilkeye hizmet eder:

- landing satış yapar,
- wizard değer üretir,
- preview sahiplenme yaratır,
- upgrade ödeme dönüştürür.
