# Funnel Rebuild Master Plan

## Amaç

Bu doküman, Book Generator ürününü klasik bir `dashboard/panel` deneyiminden çıkarıp yüksek dönüşüm odaklı, yönlendirmeli bir kitap oluşturma akışına dönüştürmek için ana karar setini tanımlar.

Yeni ana akış:

`Landing -> Hemen Başla -> Kayıtsız Wizard -> Generate -> Bekleme + Üyelik -> Preview -> Premium / Export`

Ana vaat:

> İlk kitabının önizlemesini dakikalar içinde oluştur.

## Neden Değişiyoruz

Mevcut ürün deneyimi ilk temas anında fazla uygulama odaklıdır. Kullanıcı daha ürün değerini görmeden:

- uygulama kabuğuyla karşılaşıyor,
- ayar ve plan ekranlarını görüyor,
- kitap üretim sürecini yönlendirmeli değil, araç benzeri hissediyor.

Bu yapı teknik kullanıcılar için yeterli olabilir; ancak pazarlama ve dönüşüm açısından zayıftır. Yeni mimaride amaç, kullanıcıya önce değer göstermek, sonra hesap bağlatmak, en son ödeme istemektir.

## Mevcut Repo Gerçeği

Bu plan, doğrudan mevcut repo yapısına bağlanır:

- Ana frontend yüzeyi: `web/`
- Legacy / yardımcı yüzey: `dashboard/`
- Mevcut uygulama kabuğu: `web/src/components/app/app-frame.tsx`
- Mevcut wizard: `web/src/components/app/wizard-screen.tsx`
- Mevcut demo/preview auth: `web/src/lib/preview-auth.ts`
- Mevcut backend istemcisi: `web/src/lib/dashboard-api.ts`
- Mevcut analitik katmanı: `web/src/lib/analytics.ts`
- Mevcut backend servis: `dashboard_server.py`

Karar:

- `web/` bundan sonra ana ürün yüzeyi ve source of truth olacaktır.
- `dashboard/` kısa vadede legacy/fallback olarak korunabilir; ancak yeni funnel burada büyütülmeyecektir.

## Ürün Kural Seti

### Zorunlu Ürün Kuralları

- Kullanıcı ilk temas anında kayıt olmayacak.
- İlk ücretsiz değer, tam kitap değil; `kapak + outline + ilk %20 preview` olacak.
- Üyelik isteği üretim başladıktan sonra, bekleme aşamasında çıkacak.
- Ücretsiz kullanıcıya tam içerik istemci tarafında asla gönderilmeyecek.
- `PDF`, `EPUB`, `full manuscript`, `tam düzenleme` premium arkasında olacak.
- Varsayılan preview oranı `%20`.
- Varsayılan auth yaklaşımı `Google + magic link`.
- Varsayılan ödeme akışı `Stripe Checkout`.
- Guest draft yaşam süresi `24 saat`.
- Varsayılan text fallback sırası mevcut benchmark sonucuna göre korunacak.
- Varsayılan görsel fallback sırası `grok-imagine -> nano-banana-2 -> nano-banana-pro` olacak.

### İçerik Kalitesi Kuralları

- Seçilen kitap dili hangi dil ise bölüm başlıkları, sistem başlıkları ve jenerik etiketler de aynı dilde olacak.
- Türkçe kitapta `Chapter 1`, `Chapter:` gibi İngilizce sızıntılar kabul edilmeyecek.
- Outline, başlık ve chapter üretimi tek dil standardına zorlanacak.
- Preview ve export çıktılarında dil uyumsuzluğu kalite hatası sayılacak.

## Dönüşüm Mantığı

Yeni funnel şu psikoloji üzerine kurulur:

1. Kullanıcıyı ilk 10 saniyede aksiyona sok.
2. Ürün değerini ekranda somutlaştır.
3. Kullanıcı emek verdikten sonra hesabını bağlat.
4. Sahiplenme hissi oluşunca premium iste.
5. Premium teklifini `ödeme duvarı` değil `çıktı açma anı` olarak konumlandır.

Bu nedenle kayıt, login, plan seçimi ve ayarlar ilk deneyimden çıkarılır.

## Kullanıcı Segmentleri

| Segment | Tanım | Ne Görür | Temel Hedef |
| --- | --- | --- | --- |
| Ziyaretçi | İlk kez gelen, oturumsuz kullanıcı | Landing, examples, pricing, faq, wizard başlangıcı | Wizard başlatmak |
| Guest Builder | Kayıtsız ama wizard’a giren kullanıcı | Wizard, generate, signup bridge | Preview’a ulaşmak |
| Registered User | Hesabı olan ama premium olmayan kullanıcı | Library, preview, paywall, upgrade | Ödeme yapmak |
| Premium User | Ödeme yapmış kullanıcı | Full manuscript, export, tam düzenleme | İndirmek, düzenlemek, tekrar üretmek |

## Ürün Deneyimi İlkeleri

### Pazarlama İlkeleri

- İlk ekranda tek net vaat olacak.
- Kopya kısa, büyük ve güven verici olacak.
- Kullanıcı hiçbir ekranda “şimdi ne yapacağım?” dememeli.
- Çok seçenek değil, tek ana aksiyon gösterilecek.
- Ürün “araç” değil, “sonuç üreten stüdyo” gibi hissettirecek.

### Ürün Tasarım İlkeleri

- Her ekranda yalnızca birincil görev olacak.
- Formlar kısa olacak.
- AI yardımı kritik alanlarda görünür olacak.
- Autosave varsayılan davranış olacak.
- Loading ekranı boş spinner olmayacak; süreç anlatılacak.
- Preview ekranı gerçek değer gösterecek.

### Güvenlik İlkeleri

- Full manuscript ücretsiz kullanıcıya ağ üzerinden dönmeyecek.
- Preview oranı server-side kırpılacak.
- Export yalnız premium kullanıcı için çalışacak.
- Guest -> account merge server-side yapılacak.

## Faz Bazlı Yol Haritası

### Faz 0: Ürün Kararlarını Sabitle

- Yeni funnel kural setini onayla.
- Free vs premium yetkilerini sabitle.
- Preview oranını ve signup anını sabitle.
- Tek premium plan mı iki plan mı olacağını belirle.

Çıktı:

- Bu master plan ve bağlı spesifikasyon dokümanları.

### Faz 1: Route ve Bilgi Mimarisi

- `Landing`, `Start`, `Preview`, `Upgrade`, `Library` yollarını netleştir.
- Eski `/app` davranışını yeniden tanımla.
- Legacy yönlendirme kurallarını yaz.

Çıktı:

- Yeni route şeması.
- CTA akış haritası.

### Faz 2: Wizard Yeniden Tasarımı

- Mevcut `web/src/components/app/wizard-screen.tsx` akışını çok adımlı guided flow’a dönüştür.
- Başlık, alt başlık, outline, stil için AI yardımcı aksiyonlarını ekle.
- Autosave ve draft state’i server-ready hale getir.

Çıktı:

- Yeni wizard shell.
- Yeni step bileşenleri.

### Faz 3: Generate + Signup Bridge

- Generate sonrası üretim progress ekranını kur.
- Bekleme sırasında signup bridge tasarla.
- Guest draft ile account merge akışını tanımla.

Çıktı:

- Job yaşam döngüsü.
- Signup handoff.

### Faz 4: Preview + Paywall

- Preview sayfasını kapağı, içindekileri ve `%20` metni gösterecek şekilde kur.
- Kilitli bölümleri görsel olarak anlamlı hale getir.
- Download ve full unlock aksiyonlarını premiuma bağla.

Çıktı:

- Preview ekranı.
- Paywall modal/sayfa yapısı.

### Faz 5: Billing + Access Control

- Stripe Checkout entegrasyonunu preview ve export akışına bağla.
- Premium sonrası unlock davranışını kur.
- İzin matrisini tüm backend endpoint’lere uygula.

Çıktı:

- Premium erişim modeli.
- Export guard.

### Faz 6: Library + Retention

- Giriş yapmış kullanıcı için kitap kütüphanesini sadeleştir.
- Preview, draft ve premium durumlarını kart bazında göster.
- Tekrar girişte kullanıcıyı son kitabına döndür.

Çıktı:

- Yeni `/app/library`.
- Kullanıcı geri dönüş akışı.

### Faz 7: Ölçümleme ve Optimizasyon

- Funnel event’lerini yeni akışa göre genişlet.
- CTA ve paywall kopyalarında A/B test hazırlığı yap.
- Haftalık ölçüm panelini tanımla.

Çıktı:

- Event sözlüğü.
- KPI raporlama standardı.

## Başarı Metrikleri

### Ana KPI’lar

- `wizard_start_rate`
- `wizard_completion_rate`
- `generate_start_rate`
- `signup_conversion_rate`
- `preview_view_rate`
- `preview_to_checkout_rate`
- `checkout_to_paid_rate`
- `paid_to_export_rate`

### Yardımcı KPI’lar

- Adım başına terk oranı
- AI yardımcı buton kullanım oranı
- Ortalama generation bekleme süresi
- Preview açılış süresi
- Premium yükseltme süresi
- Mobil ve desktop dönüşüm farkı

## Repo İçinde Source of Truth Kararı

### Frontend

- Source of truth: `web/src/app/*`, `web/src/components/*`, `web/src/lib/*`
- Legacy ref: `dashboard/`

### Backend

- Source of truth: `dashboard_server.py`
- Bu plan uygulanırken backend API yüzeyi genişletilebilir; ancak tek uygulama mantığı dağılmamalı.

### Settings ve Provider Katmanı

- Mevcut provider/fallback mantığı korunacak.
- Funnel dönüşümü provider entegrasyonunu bozmayacak.
- Preview/free/premium guard, provider çağrılarının etrafına sarılacak.

## Ana Riskler

### Ürün Riskleri

- Kullanıcıya “ücretsiz kitap” vaat edilip son anda kilit koyulursa aldatılmış hissi doğabilir.
- Çözüm: Başından beri “önizleme ücretsiz” dilini kullan.

### Teknik Riskler

- Mevcut localStorage tabanlı preview auth üretim ortamı için yetersiz.
- Çözüm: server-side guest draft ve merge yapısı.

### Maliyet Riskleri

- Guest kullanıcılar generate hattını suistimal edebilir.
- Çözüm: guest quota, throttle, TTL ve generation limitleri.

### UX Riskleri

- Signup bridge yanlış tonda yazılırsa kullanıcıyı kesebilir.
- Çözüm: “hesap aç” yerine “kitabını kaybetme” çerçevesi.

## Release Kriterleri

İlk release ancak aşağıdaki şartlarla kabul edilir:

- Ziyaretçi kayıt olmadan wizard’a girebiliyor.
- Wizard autosave ile kesintisiz ilerliyor.
- Generate sonrası signup bridge doğru anda açılıyor.
- Signup sonrası aynı job’a bağlanılıyor.
- Preview yalnız `%20` içerik gösteriyor.
- Free kullanıcı export alamıyor.
- Premium kullanıcı ödeme sonrası export alabiliyor.
- Full manuscript free kullanıcıya network response’larında sızmıyor.
- Mobilde tüm ana akış kullanılabilir durumda.

## Bu Dokümana Bağlı Alt Dokümanlar

- `FUNNEL_ROUTE_AND_IA_SPEC.md`
- `WIZARD_PAGE_BY_PAGE_SPEC.md`
- `GENERATE_SIGNUP_PREVIEW_SPEC.md`
- `PAYWALL_BILLING_AND_ACCESS_RULES.md`
- `BACKEND_DRAFT_JOB_AND_SECURITY_SPEC.md`
- `DESIGN_SYSTEM_AND_UI_PRINCIPLES.md`
- `ANALYTICS_EXPERIMENTS_AND_ACCEPTANCE.md`

## Son Karar

Bu dönüşümün ana amacı yalnızca tasarım yenilemesi değildir. Amaç, ilk kullanıcı deneyimini doğrudan gelir üreten bir funnel’a çevirmektir.

Başlangıç prensibi nettir:

- önce değer,
- sonra hesap,
- en son ödeme.
