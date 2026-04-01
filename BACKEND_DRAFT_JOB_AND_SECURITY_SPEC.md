# Backend Draft, Job and Security Spec

## Amaç

Bu doküman, yeni funnel’ın backend gereksinimlerini tanımlar. Hedef:

- guest kullanıcıyı güvenli şekilde yönetmek,
- generation job’larını izlemek,
- preview ile full manuscript’i ayırmak,
- premium guard’ı sağlam kurmaktır.

## Mevcut Durum

Bugün frontend tarafı büyük ölçüde şu iki yapıya dayanır:

- `web/src/lib/preview-auth.ts` ile localStorage tabanlı demo auth
- `web/src/lib/dashboard-api.ts` ile `/api/backend/*` çağrıları

Backend yüzeyi `dashboard_server.py` içinde şu ana grupları sunar:

- `/api/books`
- `/api/settings`
- `/api/build`
- `/api/workflows`
- `/api/books/<slug>/...`

Bu yapı demo ve tek kullanıcı odaklıdır. Yeni funnel için daha net bir server-side state modeline ihtiyaç vardır.

## Mimari Karar

Yeni mimaride üç veri katmanı bulunur:

1. Guest session
2. Book draft / generation job
3. Final preview / premium content

## Guest Draft Modeli

### Amaç

Kayıtsız kullanıcının wizard verisini güvenli ve süreli olarak saklamak.

### Temel Kurallar

- Her guest kullanıcıya opaque bir session token verilir.
- Bu token frontend’de cookie veya güvenli storage ile tutulur.
- Token’ın düz hali veritabanında tutulmaz; hash veya server-side signed model tercih edilir.

### Önerilen Veri Alanları

#### `guest_sessions`

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | uuid | iç sistem kimliği |
| `token_hash` | string | session token hash’i |
| `ip_hash` | string | abuse kontrolü için opsiyonel |
| `user_agent_hash` | string | opsiyonel |
| `created_at` | datetime | oluşturulma zamanı |
| `last_seen_at` | datetime | son aktivite |
| `expires_at` | datetime | TTL sonu |

TTL kararı:

- `24 saat`

## Draft Tablosu

#### `book_drafts`

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | uuid | draft id |
| `guest_session_id` | uuid nullable | guest kullanıcı bağı |
| `user_id` | uuid nullable | signup sonrası kullanıcı bağı |
| `status` | string | draft state |
| `topic` | text | konu |
| `book_type` | string | kitap tipi |
| `audience` | text | hedef kitle |
| `language` | string | dil |
| `title` | text | başlık |
| `subtitle` | text | alt başlık |
| `outline_json` | json | bölüm planı |
| `style_json` | json | ton, derinlik, kapak yönü |
| `metadata_json` | json | diğer yardımcı alanlar |
| `created_at` | datetime | oluşturulma zamanı |
| `updated_at` | datetime | güncelleme zamanı |

### Draft Status Önerileri

- `collecting_inputs`
- `ready_to_generate`
- `generation_started`
- `awaiting_signup`
- `attached_to_user`
- `expired`

## Book Job Tablosu

#### `book_jobs`

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `id` | uuid | job id |
| `draft_id` | uuid | kaynak draft |
| `book_id` | uuid nullable | final kitap kaydı |
| `provider_chain` | json | kullanılan model/fallback geçmişi |
| `current_stage` | string | anlık stage |
| `status` | string | job status |
| `attempt_count` | int | retry sayısı |
| `error_code` | string nullable | hata kodu |
| `error_message` | text nullable | hata özeti |
| `created_at` | datetime | başlangıç |
| `updated_at` | datetime | güncelleme |
| `completed_at` | datetime nullable | bitiş |

### Job Statüleri

- `queued`
- `generating`
- `awaiting_signup`
- `completed_preview`
- `premium_unlocked`
- `export_ready`
- `failed`

### Stage Değerleri

- `building_outline`
- `generating_chapters`
- `generating_covers`
- `assembling_preview`
- `ready`

## Book ve Preview Ayrımı

### Kural

- Full manuscript ayrı saklanır.
- Preview ayrı saklanır veya runtime’da kırpılır.
- Free endpoint hiçbir zaman full manuscript dönmez.

### Önerilen Tablolar

#### `books`

Temel metadata:

- `id`
- `slug`
- `user_id`
- `title`
- `subtitle`
- `language`
- `cover_asset_id`
- `back_cover_asset_id`
- `status`

#### `book_manuscripts`

- `book_id`
- `full_text_storage_path`
- `toc_json`
- `chapter_manifest_json`
- `word_count`

#### `book_previews`

- `book_id`
- `preview_text`
- `preview_ratio`
- `preview_chapter_manifest_json`
- `locked_chapter_manifest_json`
- `generated_at`

## Preview API Shape

Önerilen response:

```json
{
  "book": {
    "id": "uuid",
    "slug": "minecraft-oyun-rehberi",
    "title": "Minecraft Oyun Rehberi",
    "subtitle": "Yeni başlayanlar için tam başlangıç kitabı",
    "language": "Turkish",
    "cover_image": "/assets/cover.png",
    "back_cover_image": "/assets/back.png"
  },
  "preview": {
    "ratio": 0.2,
    "toc": [
      { "title": "Minecraft Nedir?" },
      { "title": "İlk Gece Hayatta Kalma" }
    ],
    "visible_sections": [
      { "title": "Giriş", "content": "..." }
    ],
    "locked_sections": [
      { "title": "Redstone Mantığı", "teaser": "Kilitli bölüm" }
    ]
  },
  "entitlements": {
    "can_download_pdf": false,
    "can_download_epub": false,
    "can_view_full_book": false
  }
}
```

## Full Manuscript Saklama Kuralı

- Full manuscript ağ üzerinden yalnız premium yetki kontrolü sonrası döner.
- Preview endpoint’i full text dosyasını asla ham haliyle serialize etmez.
- Frontend `locked_sections` verisinden daha fazlasını bilemez.

## Export Authorization Kuralı

Export endpoint davranışı:

- registered non-premium -> `403 premium_required`
- premium -> export job başlatılır

Örnek guard:

- `POST /api/books/:id/exports/pdf`
- `POST /api/books/:id/exports/epub`

## Signup Sonrası Merge Davranışı

### Hedef

Guest draft ve job’ın kullanıcı hesabına tekil şekilde bağlanması.

### Kurallar

- aynı guest token için birden fazla aktif draft açılabilir ama birincil draft kavramı tanımlanmalıdır
- signup sonrası `guest_session_id` ile bulunan tüm açık draftlar ilgili kullanıcıya bağlanabilir
- merge sonrası guest token derhal geçersiz olmak zorunda değildir; ama sonraki mutasyonlarda kullanıcı oturumu esas alınır
- duplicate `book` kaydı üretilmemelidir

## Abuse Guard

### Gerekçe

Guest generation maliyetlidir. Bu yüzden ücretsiz akış suistimale açık bırakılmamalıdır.

### Koruma Katmanları

- guest başına günlük draft limiti
- guest başına günlük generation limiti
- IP bazlı throttle
- session bazlı throttle
- provider hatalarında kontrollü retry
- aynı draft için eşzamanlı ikinci generation job engeli

### Önerilen İlk Limitler

- guest başına günlük 2 tam generation
- taslak üzerinde 1 aktif generation
- 1 dakika içinde aşırı workflow çağrısına throttle

## Hata ve Retry

### Retry Kuralı

- provider failover mevcut chain’e göre çalışır
- stage bazlı retry loglanır
- failure reason kullanıcıya teknik ayrıntı vermeden açıklanır

### Kullanıcıya Dönülecek Hata Türleri

- `temporary_generation_issue`
- `signup_required`
- `preview_not_ready`
- `premium_required`
- `backend_unavailable`

## Observability

Takip edilmesi gereken alanlar:

- draft oluşturma oranı
- draft -> generate oranı
- generate -> signup oranı
- signup -> preview başarı oranı
- preview hazırlama süresi
- provider fallback oranı
- premium unlock oranı
- export başarı oranı
- dil uyumsuzluğu kalite hataları

## Güvenlik Notları

- Guest token plain text olarak loglanmamalıdır.
- Full manuscript path veya private storage URL frontend’e verilmemelidir.
- Preview içerikleri cache’lenebilir; full content çok daha sıkı cache ve yetki kontrolüne sahip olmalıdır.
- Admin ve internal endpoint’ler public surface ile karışmamalıdır.

## Geçiş Planı

### Aşama 1

- mevcut localStorage wizard state korunur
- server-side draft modeli eklenir

### Aşama 2

- signup sonrası merge aktif hale gelir

### Aşama 3

- preview ve export guard tamamen server-side yetkiyle korunur

### Aşama 4

- demo auth kalıntıları kaldırılır

## Son Karar

Bu funnel’ın ticari olarak güvenli çalışması için asıl kritik nokta tasarım değil, veri ayrımıdır:

- draft ayrıdır,
- preview ayrıdır,
- full content ayrıdır,
- premium yetki kesin server-side uygulanır.
