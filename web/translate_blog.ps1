$ErrorActionPreference = "Stop"
$filePath = "C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts"

# Read with UTF-8 encoding
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 1. Replace category
$content = $content.Replace(
    '    summary: "Provides the simplest answer to the first-time user''s fear.",
    category: "Başlangıç",
    readTime: "6 min",',
    '    summary: "Provides the simplest answer to the first-time user''s fear.",
    category: "Getting Started",
    readTime: "8 min",'
)

# 2. Replace intro
$oldIntro = '    intro: "Bu soruyu soran herkes aynı noktada takılır: yazmak zor bir beceri gibi görünür, aylarca pratik gerektirir, belki de herkese göre değildir. Oysa rehber kitap ve bilgi kitabı yazmak, edebi roman yazmaktan bambayla farklı bir iştir. Burada güzel cümleler değil, net bilgi ve doğru yapı önemlidir. Gerçekte çoğu insan yazarlıktan değil, başlamaktan korkuyor - ve başlamak için mükemmel bir yazar olmana hiç gerek yok. Doğru bir araç ve net bir konu, seni beklediğinden çok daha hızlı bir kitap sahibi yapabilir.",'
$newIntro = '    intro: "Everyone who asks this question gets stuck at the same point: writing seems like a difficult skill, it requires months of practice, and perhaps it is not for everyone. But writing a guide book or a reference book is completely different from writing a literary novel. Here, what matters is not beautiful sentences but clear information and the right structure. In reality, most people are not afraid of writing — they are afraid of starting. And to start, you do not need to be a perfect writer at all. The right tool and a clear topic can make you a book owner much faster than you expect.",'

$content = $content.Replace($oldIntro, $newIntro)

# 3. Replace section 1
$oldS1 = '      ["Yazarlık korkusu gerçek mi?", "Evet, gerçek - ama çoğu zaman yanlış kaynaktan geliyor. İnsanlar ''iyi bir yazar olmam lazım'' diye düşünür; bu düşünce başlamalarını engelleyen en büyük mental bloğa dönüşür. Oysa bilgi kitabı yazarlığı edebi bir roman yazmaktan tamamen farklıdır. Bir romanda üslup, dil zenginliği ve kurgusal yaratıcılık merkezde yer alır. Rehber kitapta ise okur senden güzel cümleler değil, net bilgi ve pratik yönlendirme bekler. Zaten bildiğin bir konuda birikimini aktarıyorsun - bu bir arkadaşına bir şeyi anlatmaktan pek farklı değil. Bir koç, danışman ya da deneyimli bir uygulayıcı olarak zaten sahip olduğun bilgiyi kağıda dökmek yazarlık değil, aktarım becerisidir. Farklılık sadece yapıda: kitap, konuşmayı belirli bir sıraya sokar ve okura adım adım ilerler. Bu yapıyı kurmak için de çok güçlü bir yazar olmak gerekmez."],'
$newS1 = '      ["Is the fear of writing real?", "Yes, it is real — but most of the time it comes from the wrong source. People think ''I need to be a good writer''; this thought becomes the biggest mental block that prevents them from starting. But writing a reference book is completely different from writing a literary novel. In a novel, style, linguistic richness, and fictional creativity take center stage. In a guide book, the reader expects not beautiful sentences but clear information and practical direction. You are already transferring your accumulated knowledge on a topic you know — this is not much different from explaining something to a friend. Putting down on paper the knowledge you already possess as a coach, consultant, or experienced practitioner is not writing — it is a transfer skill. The difference is only in structure: the book organizes the conversation into a certain order and progresses step by step with the reader. You do not need to be a very strong writer to build this structure."],'

$content = $content.Replace($oldS1, $newS1)

# 4. Replace section 2
$oldS2 = '      ["Yazmak ile yönlendirmek farkı", "Geleneksel kitap yazımında her kelimeyi sen üretirsin - boş sayfayla başlarsın, her cümle senden çıkar, her paragraf senin emeğindir. AI destekli kitap üretiminde ise rolün köklü biçimde değişiyor: sen yönlendiriyorsun, sistem taslak üretiyor, sen düzenliyorsun. Bu süreçte yazarlık becerisi değil, içerik kararları alabilmek önemli. Konu ne olacak? Hangi bölümler olacak? Hangi örnekler verilecek? Hangi ton kullanılacak? Bu soruları cevaplayabiliyorsan kitap üretebilirsin. Cümleleri mükemmel kurmak zorunda değilsin - taslağı görüp ''bu doğru mu, eksik mi, değişmeli mi?'' diyebilmek yeterli. Bu rol bir editöre ya da proje yöneticisine benziyor: nihai kararlar sende, üretim ağırlığı araçta. Yazarlık korkusunu bu zihinsel çerçeve ile ele almak, çoğu insanın ilk adımı atmasını kolaylaştırıyor."],'
$newS2 = '      ["The difference between writing and directing", "In traditional book writing, you produce every word yourself — you start with a blank page, every sentence comes from you, every paragraph is your effort. In AI-supported book production, however, your role changes fundamentally: you direct, the system generates drafts, and you edit. In this process, what matters is not writing skill but the ability to make content decisions. What will the topic be? Which chapters will there be? Which examples will be given? Which tone will be used? If you can answer these questions, you can produce a book. You do not have to construct perfect sentences — being able to look at the draft and say ''is this correct, is anything missing, should it be changed?'' is enough. This role resembles an editor or a project manager: the final decisions are yours, the production weight is on the tool. Approaching the fear of writing with this mental framework makes it easier for most people to take the first step."],'

$content = $content.Replace($oldS2, $newS2)

# 5. Replace section 3
$oldS3 = '      ["AI aracın rolü nedir?", "Book Generator gibi araçlar seni boş sayfayla baş başa bırakmaz. Konu, hedef okur ve ton bilgilerini girdiğinde sistem bir outline önerir - bölüm başlıkları, önerilen sıralama ve genel yapıyla birlikte. Outline''ı onayladığında bölüm içeriklerini üretir; her bölümü ayrı ayrı gözden geçirip düzenleyebilirsin. Her aşamada sana düzenleme, yeniden üretim veya elle yazma seçeneği sunar. Araç bir taslak makinesidir - heykel kaba halde seni bekliyor, sen son şekli veriyorsun. Bu süreçte ''yazarlık'' değil, içerik editörlüğü yapıyorsun: hangi bölüm kalacak, hangi cümle değişecek, hangi örnek daha somut hale getirilecek? Bu kararlar senin uzmanlığını yansıtıyor. Araç sadece taslağı hızlı kuruyor; kitabın kalitesi senin düzenleme gözüne ve konu bilgine bağlı."],'
$newS3 = '      ["What is the AI tool''s role?", "Tools like Book Generator do not leave you alone with a blank page. When you enter the topic, target reader, and tone information, the system suggests an outline — complete with chapter titles, proposed ordering, and overall structure. Once you approve the outline, it generates chapter content; you can review and edit each chapter individually. At every stage, it offers you the option to edit, regenerate, or write manually. The tool is a draft machine — the sculpture waits for you in rough form, and you give it its final shape. In this process, you are not ''writing'' but doing content editing: which chapter will stay, which sentence will change, which example will be made more concrete? These decisions reflect your expertise. The tool merely builds the draft quickly; the quality of your book depends on your editorial eye and subject knowledge."],'

$content = $content.Replace($oldS3, $newS3)

# 6. Replace section 4
$oldS4 = '      ["Sihirbaz akışı neden fark yaratıyor?", "İlk kullanıcının en büyük engeli boş ekrandır. ''Nereden başlayayım?'' sorusu cevapsız kaldığında insanlar ya mükemmeliyetçilikle felç oluyor ya da süreci sonsuza erteliyor. Neyi soracağını bilmeden, nereden başlayacağını bilmeden geçen her dakika motivasyonu düşürür. Wizard akışı bu engeli ortadan kaldırır: sana sırayla yönlendirilmiş sorular sorar, cevaplarına göre ilerler. Konu ne? Hedef okur kim? Kitap kaç bölüm olsun? Ton nasıl olsun? Bu soruları cevapladığında sistemin elinde bir brief var - ve kısa sürede sana bir taslak sunuyor. Boş ekranda sıfırdan başlamak yerine hazır bir yapıyla başlamak, özellikle ilk kitabında devasa bir fark yaratır. Düzeltmek, sıfırdan kurmaktan her zaman daha kolaydır. Wizard seni bu noktaya taşıyor."],'
$newS4 = '      ["Why does the wizard workflow make a difference?", "The biggest obstacle for a first-time user is the blank screen. When the question ''Where do I start?'' goes unanswered, people either become paralyzed by perfectionism or postpone the process indefinitely. Every minute spent without knowing what to ask or where to begin lowers motivation. The wizard workflow removes this obstacle: it asks you guided questions in sequence and progresses based on your answers. What is the topic? Who is the target reader? How many chapters should the book have? What should the tone be? When you answer these questions, the system has a brief — and in a short time it presents you with a draft. Starting with a ready-made structure instead of from scratch on a blank screen makes an enormous difference, especially for your first book. Correcting is always easier than building from zero. The wizard carries you to this point."],'

$content = $content.Replace($oldS4, $newS4)

# 7. Replace section 5
$oldS5 = '      ["Net amaç mükemmel prompttan üstündür", "AI araçlarıyla çalışırken en sık duyulan tavsiye daha iyi prompt yazmak olur - ''doğru prompt yazmasını bilmiyorum'' kaygısı, başlamayı engelleyen bir başka duvar haline gelir. Ama gerçekte asıl fark yaratan şey teknik prompt becerisi değil, içerik netliğidir. Şu üç soruya cevap verebildiğinde sistem zaten çok daha iyi çalışır: Ne anlatmak istiyorum? Kime yazıyorum? Kitabı bitiren okur ne yapabilecek ya da ne bilecek? Bu sorulara net cevabın varsa, sistem bunu işlevsel bir kitap yapısına dönüştürebilir. Teknik prompt becerisine ihtiyaç duymadan, sadece konunu ve amacını samimi biçimde ifade ederek çok iyi sonuçlar alabilirsin. Prompt mühendisliği değil, içerik sahibi olmak asıl güç kaynağı."],'
$newS5 = '      ["Clear purpose beats perfect prompts", "When working with AI tools, the most frequently heard advice is to write better prompts — the concern of ''I don''t know how to write the right prompt'' becomes yet another wall that prevents starting. But in reality, what truly makes a difference is not technical prompt skill but content clarity. When you can answer these three questions, the system already works much better: What do I want to convey? Who am I writing for? What will the reader be able to do or know after finishing the book? If you have clear answers to these questions, the system can transform them into a functional book structure. Without needing technical prompt skills, you can achieve very good results simply by expressing your topic and purpose genuinely. Not prompt engineering but owning the content is the real source of power."],'

$content = $content.Replace($oldS5, $newS5)

# 8. Replace section 6
$oldS6 = '      ["İlk adımı atmak için ne lazım?", "Sadece bir konu. Ve o konuda başkasına anlatabilecek bir şeyin olması - yıllar içinde öğrendiğin bir beceri, defalarca yaşadığın bir süreç, sürekli soru aldığın bir alan. Yazarlık deneyimine, akıcı bir İngilizceye ya da yayıncılık sektörü hakkında uzmanlığa ihtiyacın yok. Book Generator Türkçe arayüzle çalışır ve kitabı istediğin dilde üretir - Türkçe brief gir, İngilizce kitap çıkar. Kayıt olmadan başlayabilirsin: konu girişi yap, 30 saniyede outline ve kapak önizlemeni gör. Beğenmediysen geri dön, konuyu değiştir, farklı bir yön dene. Risk yok, boş sayfa yok, ön bilgi şartı yok. Yazarlık korkusunu aşmanın en iyi yolu tartışmak değil, bir taslak görmektir - ve bunu görmek için sadece bir konu girmen yeterli."],'
$newS6 = '      ["What do you need to take the first step?", "Just a topic. And having something to explain to others about that topic — a skill you have learned over the years, a process you have experienced repeatedly, or a field where people constantly ask you questions. You do not need writing experience, fluent English, or expertise in the publishing industry. Book Generator works with a Turkish interface and produces the book in whatever language you want — enter a Turkish brief, get an English book out. You can start without registering: enter your topic and see your outline and cover preview in 30 seconds. If you don''t like it, go back, change the topic, or try a different angle. No risk, no blank page, no prerequisite knowledge required. The best way to overcome the fear of writing is not to debate it but to see a draft — and to see one, all you need is to enter a topic."],'

$content = $content.Replace($oldS6, $newS6)

# Write back
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)

Write-Host "Translation complete. Checking replacements..."

# Verify
if ($content -match "Başlangıç" -and $content -match "yazmayi-bilmeden") {
    # Check specifically within the blog post range
    $lines = $content -split "`n"
    $inPost = $false
    $remainingTurkish = @()
    foreach ($line in $lines) {
        if ($line -match "yazmayi-bilmeden") { $inPost = $true }
        if ($inPost -and $line -match "kitap-fikri-nasil-secilir") { $inPost = $false; break }
        if ($inPost) {
            # Check for common Turkish words that shouldn't be there
            if ($line -match "[çğıöşüÇĞİÖŞÜ]" -and $line -notmatch "slug") {
                $remainingTurkish += $line.Trim()
            }
        }
    }
    if ($remainingTurkish.Count -gt 0) {
        Write-Host "WARNING: Remaining Turkish text found:"
        $remainingTurkish | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "SUCCESS: All Turkish text in the blog post has been translated to English."
    }
}
