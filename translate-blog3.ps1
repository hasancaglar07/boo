[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$filePath = 'C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts'
$c = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 1. category
$c = $c.Replace("category: `"Başlangıç`"", "category: `"Getting Started`"")

# 2. intro
$oldIntro = "Bu soruyu soran herkes aynı noktada takılır: yazmak zor bir beceri gibi görünür, aylarca pratik gerektirir, belki de herkese göre değildir. Oysa rehber kitap ve bilgi kitabı yazmak, edebi roman yazmaktan bambayla farklı bir iştir. Burada güzel cümleler değil, net bilgi ve doğru yapı önemlidir. Gerçekte çoğu insan yazarlıktan değil, başlamaktan korkuyor - ve başlamak için mükemmel bir yazar olmana hiç gerek yok. Doğru bir araç ve net bir konu, seni beklediğinden çok daha hızlı bir kitap sahibi yapabilir."
$newIntro = "Everyone who asks this question gets stuck at the same point: writing seems like a difficult skill, one that requires months of practice, maybe not for everyone. But writing a guide book or informational book is fundamentally different from writing a literary novel. What matters here is not beautiful sentences, but clear information and correct structure. In reality, most people are afraid not of writing but of starting — and to start, you don't need to be a perfect writer. The right tool and a clear topic can make you a book owner much faster than you expect."
$c = $c.Replace($oldIntro, $newIntro)

# 3. Section 1 - question
$c = $c.Replace("`"Yazarlık korkusu gerçek mi?`"", "`"Is the fear of writing real?`"")

# 4. Section 1 - answer
$oldS1 = "Evet, gerçek - ama çoğu zaman yanlış kaynaktan geliyor. İnsanlar 'iyi bir yazar olmam lazım' diye düşünür; bu düşünce başlamalarını engelleyen en büyük mentol bloğa dönüşür. Oysa bilgi kitabı yazarlığı edebi bir roman yazmaktan tamamen farklıdır. Bir romanda üslup, dil zenginliği ve kurgusal yaratıcılık merkezde yer alır. Rehber kitapta ise okur senden güzel cümleler değil, net bilgi ve pratik yönlendirme bekler. Zaten bildiğin bir konuda birikimini aktarıyorsun - bu bir arkadaşına bir şeyi anlatmaktan pek farklı değil. Bir koç, danışman ya da deneyimli bir uygulayıcı olarak zaten sahip olduğun bilgiyi kağıda dökmek yazarlık değil, aktarım becerisidir. Farklılık sadece yapıda: kitap, konuşmayı belirli bir sıraya sokar ve okura adım adım ilerler. Bu yapıyı kurmak için de çok güçlü bir yazar olmak gerekmez."
$newS1 = "Yes, it is real — but most of the time it comes from the wrong source. People think 'I need to be a good writer'; this thought becomes the biggest mental block preventing them from starting. But informational book authorship is completely different from writing a literary novel. In a novel, style, language richness, and fictional creativity take center stage. In a guide book, the reader expects not beautiful sentences but clear information and practical direction. You're already transferring knowledge on a topic you know — this is not much different from explaining something to a friend. As a coach, consultant, or experienced practitioner, putting your accumulated knowledge on paper is not authorship but transfer skill. The only difference is structure: the book organizes the explanation in a certain sequence and takes the reader through it step by step. You don't need to be a very strong writer to build this structure."
$c = $c.Replace($oldS1, $newS1)

# 5. Section 2 - question
$c = $c.Replace("`"Yazmak ile yönlendirmek farkı`"", "`"The difference between writing and directing`"")

# 6. Section 2 - answer
$oldS2 = "Geleneksel kitap yazımında her kelimeyi sen üretirsin - boş sayfayla başlarsın, her cümle senden çıkar, her paragraf senin emeğindir. AI destekli kitap üretiminde ise rolün köklü biçimde değişiyor: sen yönlendiriyorsun, sistem taslak üretiyor, sen düzenliyorsun. Bu süreçte yazarlık becerisi değil, içerik kararları alabilmek önemli. Konu ne olacak? Hangi bölümler olacak? Hangi örnekler verilecek? Hangi ton kullanılacak? Bu soruları cevaplayabiliyorsan kitap üretebilirsin. Cümleleri mükemmel kurmak zorunda değilsin - taslağı görüp 'bu doğru mu, eksik mi, değişmeli mi?' diyebilmek yeterli. Bu rol bir editöre ya da proje yöneticisine benziyor: nihai kararlar sende, üretim ağırlığı araçta. Yazarlık korkusunu bu zihinsel çerçeve ile ele almak, çoğu insanın ilk adımı atmasını kolaylaştırıyor."
$newS2 = "In traditional book writing, you produce every word yourself — you start with a blank page, every sentence comes from you, every paragraph is your effort. In AI-supported book production, your role changes fundamentally: you direct, the system generates drafts, you edit. In this process, what matters is not writing skill but being able to make content decisions. What will the topic be? Which chapters will there be? Which examples will be given? What tone will be used? If you can answer these questions, you can produce a book. You don't have to craft perfect sentences — being able to review the draft and say 'is this right, is anything missing, should anything change?' is sufficient. This role is similar to an editor or project manager: the final decisions are yours, the production workload is on the tool. Approaching the fear of writing with this mental framework makes it easier for most people to take the first step."
$c = $c.Replace($oldS2, $newS2)

# 7. Section 3 - question
$c = $c.Replace("`"AI aracının rolü nedir?`"", "`"What is the AI tool's role?`"")

# 8. Section 3 - answer
$oldS3 = "Book Generator gibi araçlar seni boş sayfayla baş başa bırakmaz. Konu, hedef okur ve ton bilgilerini girdiğinde sistem bir outline önerir - bölüm başlıkları, önerilen sıralama ve genel yapıyla birlikte. Outline'ı onayladığında bölüm içeriklerini üretir; her bölümü ayrı ayrı gözden geçirip düzenleyebilirsin. Her aşamada sana düzenleme, yeniden üretim veya elle yazma seçeneği sunar. Araç bir taslak makinesidir - heykel kaba halde seni bekliyor, sen son şekli veriyorsun. Bu süreçte 'yazarlık' değil, içerik editörlüğü yapıyorsun: hangi bölüm kalacak, hangi cümle değişecek, hangi örnek daha somut hale getirilecek? Bu kararlar senin uzmanlığını yansıtıyor. Araç sadece taslağı hızlı kuruyor; kitabın kalitesi senin düzenleme gözüne ve konu bilgine bağlı."
$newS3 = "Tools like Book Generator don't leave you alone with a blank page. When you enter topic, target reader, and tone information, the system suggests an outline — complete with chapter titles, suggested ordering, and overall structure. When you approve the outline, it generates chapter content; you can review and edit each chapter individually. At every stage, it offers you editing, regeneration, or manual writing options. The tool is a draft machine — the rough sculpture is waiting for you, you give it its final shape. In this process, you're doing not 'writing' but content editing: which chapter stays, which sentence changes, which example becomes more concrete? These decisions reflect your expertise. The tool only builds the draft quickly; your book's quality depends on your editing eye and topic knowledge."
$c = $c.Replace($oldS3, $newS3)

# 9. Section 4 - question
$c = $c.Replace("`"Sihirbaz akışı neden fark yaratıyor?`"", "`"Why does the wizard flow make a difference?`"")

# 10. Section 4 - answer
$oldS4 = "İlk kullanıcının en büyük engeli boş ekrandır. 'Nereden başlayayım?' sorusu cevapsız kaldığında insanlar ya mükemmeliyetçilikle felç oluyor ya da süreci sonsuza erteliyor. Neyi soracağını bilmeden, nereden başlayacağını bilmeden geçen her dakika motivasyonu düşürür. Wizard akışı bu engeli ortadan kaldırır: sana sırayla yönlendirilmiş sorular sorar, cevaplarına göre ilerler. Konu ne? Hedef okur kim? Kitap kaç bölüm olsun? Ton nasıl olsun? Bu soruları cevapladığında sistemin elinde bir brief var - ve kısa sürede sana bir taslak sunuyor. Boş ekranda sıfırdan başlamak yerine hazır bir yapıyla başlamak, özellikle ilk kitabında devasa bir fark yaratır. Düzeltmek, sıfırdan kurmaktan her zaman daha kolaydır. Wizard seni bu noktaya taşıyor."
$newS4 = "The biggest obstacle for a first-time user is the blank screen. When the question 'where do I start?' goes unanswered, people either become paralyzed by perfectionism or endlessly postpone the process. Every minute spent not knowing what to ask, not knowing where to begin, lowers motivation. The wizard flow removes this obstacle: it asks you guided questions in sequence and progresses based on your answers. What's the topic? Who's the target reader? How many chapters should the book have? What should the tone be? When you answer these questions, the system has a brief — and shortly presents you with a draft. Starting with a ready-made structure instead of a blank page makes a huge difference, especially for your first book. Correcting is always easier than building from scratch. The wizard takes you to that point."
$c = $c.Replace($oldS4, $newS4)

# 11. Section 5 - question
$c = $c.Replace("`"Net amaç mükemmel prompttan üstündür`"", "`"Clear purpose beats perfect prompts`"")

# 12. Section 5 - answer
$oldS5 = "AI araçlarıyla çalışırken en sık duyulan tavsiye daha iyi prompt yazmak olur - 'doğru prompt yazmasını bilmiyorum' kaygısı, başlamayı engelleyen bir başka duvar haline gelir. Ama gerçekte asıl fark yaratan şey teknik prompt becerisi değil, içerik netliğidir. Şu üç soruya cevap verebildiğinde sistem zaten çok daha iyi çalışır: Ne anlatmak istiyorum? Kime yazıyorum? Kitabı bitiren okur ne yapabilecek ya da ne bilecek? Bu sorulara net cevabın varsa, sistem bunu işlevsel bir kitap yapısına dönüştürebilir. Teknik prompt becerisine ihtiyaç duymadan, sadece konunu ve amacını samimi biçimde ifade ederek çok iyi sonuçlar alabilirsin. Prompt mühendisliği değil, içerik sahibi olmak asıl güç kaynağı."
$newS5 = "When working with AI tools, the most common advice is to write better prompts — the concern 'I don't know how to write the right prompt' becomes another wall blocking people from starting. But in reality, what truly makes a difference is not technical prompt skill but content clarity. When you can answer these three questions, the system already works much better: What do I want to explain? Who am I writing for? What will the reader be able to do or know after finishing the book? If you have clear answers to these questions, the system can transform this into a functional book structure. Without needing technical prompt skills, just by sincerely expressing your topic and purpose, you can get very good results. Being a content owner, not a prompt engineer, is the real power source."
$c = $c.Replace($oldS5, $newS5)

# 13. Section 6 - question
$c = $c.Replace("`"İlk adımı atmak için ne lazım?`"", "`"What do you need to take the first step?`"")

# 14. Section 6 - answer
$oldS6 = "Sadece bir konu. Ve o konuda başkasına anlatabilecek bir şeyin olması - yıllar içinde öğrendiğin bir beceri, defalarca yaşadığın bir süreç, sürekli soru aldığın bir alan. Yazarlık deneyimine, akıcı bir İngilizceye ya da yayıncılık sektörü hakkında uzmanlığa ihtiyacın yok. Book Generator Türkçe arayüzle çalışır ve kitabı istediğin dilde üretir - Türkçe brief gir, İngilizce kitap çıkar. Kayıt olmadan başlayabilirsin: konu girişi yap, 30 saniyede outline ve kapak önizlemeni gör. Beğenmediysen geri dön, konuyu değiştir, farklı bir yön dene. Risk yok, boş sayfa yok, ön bilgi şartı yok. Yazarlık korkusunu aşmanın en iyi yolu tartışmak değil, bir taslak görmektir - ve bunu görmek için sadece bir konu girmen yeterli."
$newS6 = "Just a topic. And having something you can explain to someone else about that topic — a skill you've learned over the years, a process you've experienced repeatedly, an area where you constantly get questions. You don't need writing experience, fluent English, or publishing industry expertise. Book Generator works with a Turkish interface and produces your book in whichever language you want — enter a Turkish brief, output an English book. You can start without registering: enter your topic, see your outline and cover preview in 30 seconds. If you don't like it, go back, change the topic, try a different direction. No risk, no blank page, no prior knowledge required. The best way to overcome the fear of writing is not to debate it but to see a draft — and to see one, all you need is to enter a topic."
$c = $c.Replace($oldS6, $newS6)

[System.IO.File]::WriteAllText($filePath, $c, [System.Text.Encoding]::UTF8)

# Verify
$remaining = [regex]::Matches($c, '[çğıöşüÇĞİÖŞÜ]').Count
Write-Output "Replacement complete. Remaining Turkish chars in file: $remaining"
