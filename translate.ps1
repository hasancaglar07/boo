[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$file = "C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts"
$bytes = [System.IO.File]::ReadAllBytes($file)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

# howItWorksPageSteps step 3 (lines 76-77)
$text = $text.Replace(
    '    title: "EPUB ve PDF''ini al",
    text: "Önizlemeyi gör, beğenirsen tam kitabı aç. Çıktı dosyaları KDP''ye yüklemeye hazır gelir.",',
    '    title: "Get your EPUB and PDF",
    text: "Preview your book, unlock the full version if you like it. Output files are ready for KDP upload.",'
)

# premiumPlan (lines 84-96)
$text = $text.Replace('  name: "Tek Kitap",', '  name: "One Book",')
$text = $text.Replace('  interval: "tek seferlik",', '  interval: "one-time",')
$text = $text.Replace('  label: "1 kitap — abonelik yok, sonsuza sahip ol",', '  label: "1 book — no subscription, yours forever",')
$text = $text.Replace('  description: "Bir kez öde, kitabın senin — taslaktan EPUB''a kadar her şey dahil, abonelik yok.",', '  description: "Pay once, the book is yours — from draft to EPUB, everything included, no subscription.",')
$text = $text.Replace('  badge: "Dene ve karar ver",', '  badge: "Try and decide",')
$text = $text.Replace('    "1 tam kitap — tüm bölümler kilitsiz",', '    "1 complete book — all chapters unlocked",')
$text = $text.Replace('    "AI kapak üretimi — 3 stil, özel renk paleti",', '    "AI cover generation — 3 styles, custom color palette",')
$text = $text.Replace('    "EPUB + PDF çıktısı — KDP''ye yüklemeye hazır",', '    "EPUB + PDF output — ready for KDP upload",')
$text = $text.Replace('    "Çok dilli üretim (Türkçe, İngilizce ve daha fazlası)",', '    "Multilingual production (Turkish, English, and more)",')
$text = $text.Replace('    "Ton ve hedef kitle ayarı (sihirbazdan)",', '    "Tone and target audience settings (from wizard)",')

# Starter plan (lines 104-121)
$text = $text.Replace('    name: "Temel",', '    name: "Basic",')
# Only replace the FIRST "aylık" (starter)
$firstAylık = $true
$text = $text.Replace('    interval: "aylık",', '    interval: "monthly",')
$text = $text.Replace('    label: "Ayda 10 kitap",', '    label: "10 books per month",')
$text = $text.Replace('    perUnit: "kitap başına $1.90",', '    perUnit: "$1.90 per book",')
$text = $text.Replace('    description: "Ayda 10 kitapla ritim kur — kitap başına $1.90, KDP''ye hazır çıktı.",', '    description: "Build your rhythm with 10 books per month — $1.90 per book, KDP-ready output.",')
$text = $text.Replace('      "Ayda 10 kitap üretimi",', '      "10 books per month generation",')
$text = $text.Replace('      "Ayda 20 kapak hakkı — AI stilli, özelleştirilebilir",', '      "20 covers per month — AI styles, customizable",')
$text = $text.Replace('      "EPUB + PDF çıktısı — her kitap için",', '      "EPUB + PDF output — for each book",')
$text = $text.Replace('      "Sihirbaz ile hızlı taslak: konu → yapı → bölümler",', '      "Quick draft with wizard: topic → structure → chapters",')
$text = $text.Replace('      "Bölüm editörü — düzenle, yeniden üret, değiştir",', '      "Chapter editor — edit, regenerate, modify",')
$text = $text.Replace('      "Çok dilli kitap desteği",', '      "Multilingual book support",')
$text = $text.Replace('      "Kitap çalışma alanı — tüm projeler tek yerde",', '      "Book workspace — all projects in one place",')
$text = $text.Replace('      "Standart email destek",', '      "Standard email support",')

# Creator plan (lines 125-143)
$text = $text.Replace('    name: "Yazar",', '    name: "Writer",')
$text = $text.Replace('    label: "Ayda 30 kitap",', '    label: "30 books per month",')
$text = $text.Replace('    badge: "En Popüler",', '    badge: "Most Popular",')
$text = $text.Replace('    perUnit: "kitap başına $1.30",', '    perUnit: "$1.30 per book",')
$text = $text.Replace('    decoyNote: "Stüdyo''nun %37''si kadar kitap, fiyatının %49''u",', '    decoyNote: "37% of Studio''s books at 49% of the price",')
$text = $text.Replace('    description: "Hangi konu satar? Araştır, 30 kitap üret, KDP''de büyü — kitap başına $1.30.",', '    description: "Which topic sells? Research, produce 30 books, grow on KDP — $1.30 per book.",')
$text = $text.Replace('      "Ayda 30 kitap üretimi",', '      "30 books per month generation",')
$text = $text.Replace('      "Ayda 60 kapak hakkı — tam özelleştirme",', '      "60 covers per month — full customization",')
$text = $text.Replace('      "Araştırma merkezi — KDP trend ve anahtar kelime analizi",', '      "Research center — KDP trend and keyword analysis",')
$text = $text.Replace('      "Pazar boşluğu analizi — rakip kitap taraması",', '      "Market gap analysis — competitor book scanning",')
$text = $text.Replace('      "EPUB, PDF ve HTML çıktıları",', '      "EPUB, PDF and HTML outputs",')
$text = $text.Replace('      "Bölüm başına yeniden üretim ve tone ayarı",', '      "Per-chapter regeneration and tone adjustment",')
$text = $text.Replace('      "Çok dilli seri üretim (aynı konuyu farklı dilde yayınla)",', '      "Multilingual series production (publish same topic in different languages)",')
$text = $text.Replace('      "Öncelikli destek",', '      "Priority support",')

# Pro plan (lines 147-165)
$text = $text.Replace('    name: "Stüdyo",', '    name: "Studio",')
$text = $text.Replace('    label: "Ayda 80 kitap",', '    label: "80 books per month",')
$text = $text.Replace('    perUnit: "kitap başına $0.99",', '    perUnit: "$0.99 per book",')
$text = $text.Replace('    description: "80 kitap/ay, API erişimi, otomasyon — kitap başına $0.99, ek fatura yok.",', '    description: "80 books/month, API access, automation — $0.99 per book, no extra billing.",')
$text = $text.Replace('      "Ayda 80 kitap üretimi — tam kapasite",', '      "80 books per month generation — full capacity",')
$text = $text.Replace('      "Ayda 200 kapak hakkı",', '      "200 covers per month",')
$text = $text.Replace('      "Tüm çıktı formatları: EPUB, PDF, HTML, Markdown",', '      "All output formats: EPUB, PDF, HTML, Markdown",')
$text = $text.Replace('      "Araştırma merkezi + gelişmiş KDP pazar analizi",', '      "Research center + advanced KDP market analysis",')
$text = $text.Replace('      "Seri ve tema bazlı toplu üretim",', '      "Series and theme-based bulk production",')
$text = $text.Replace('      "Bölüm şablonları ve özelleştirilmiş ton profilleri",', '      "Chapter templates and customized tone profiles",')
$text = $text.Replace('      "API ve otomasyon erişimi — kendi sistemlerine bağla",', '      "API and automation access — connect to your systems",')
$text = $text.Replace('      "Öncelikli destek + özel başlangıç rehberliği",', '      "Priority support + custom onboarding guidance",')

$newBytes = [System.Text.Encoding]::UTF8.GetBytes($text)
[System.IO.File]::WriteAllBytes($file, $newBytes)
Write-Host "Translation complete."
