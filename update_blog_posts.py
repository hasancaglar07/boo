import re

filepath = r"C:\Users\ihsan\Desktop\BOOK\web\src\lib\marketing-data.ts"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# ============================================================
# 1. kdpye-yuklemeden-once-ne-kontrol-etmeli
# ============================================================

# Intro
old1_intro = (
    '    intro: "Kitabın hazır, yükleme zamanı geldi. Ama KDP yükleme ekranına geçmeden önce birkaç dakika harcayıp temel kontrolleri yapmak, ilerleyen günlerde düzeltme döngüsünden seni kurtarır. Reddedilen başvurular ve düşük dönüşüm oranları çoğunlukla önlenebilir hatalardan kaynaklanır. Bu yazı uzun bir kontrol listesi değil — yükleme öncesi yapman gereken en kritik beş kontrol.",'
)
new1_intro = (
    '    intro: "Kitabın hazır, yükleme zamanı geldi. Ama KDP yükleme ekranına geçmeden önce birkaç dakika harcayıp temel kontrolleri yapmak, ilerleyen günlerde düzeltme döngüsünden seni kurtarır. Reddedilen başvurular ve düşük dönüşüm oranları çoğunlukla önlenebilir hatalardan kaynaklanır — başlık yanlış kategoride, kapak boyutu hatalı, açıklama ilk cümlede okuru kaybediyor. Bu yazı uzun bir kontrol listesi değil; yükleme öncesi yapman gereken en kritik beş kontrolü, her birinin neden önemli olduğunu ve nasıl düzeltileceğini pratik örneklerle anlatıyor. Bu kontrolleri yapan yayıncılar, yayın sonrası \'neden satış yok?\' sorusunu çok daha az soruyor.",'
)

# Section: Metadata net mi?
old1_s1 = (
    '      ["Metadata net mi?", "KDP\'de başlık, alt başlık ve kitap açıklaması en kritik alandır. '
    'Başlık kitabın ne hakkında olduğunu tek cümlede anlatmalı. Alt başlık varsa hedef kitleyi veya vaadi netleştirmeli. '
    'Açıklama ise okura şunu sormalı: bu kitap benim için mi? İlk iki cümle en önemli — çünkü birçok platformda açıklamanın '
    'tamamı görünmez, sadece ilk birkaç satır görünür. Keyword olarak kullandığın anahtar kelimelerin başlık ve açıklamada '
    'doğal biçimde geçtiğinden emin ol."],'
)
new1_s1 = (
    '      ["Metadata net mi?", "KDP\'de başlık, alt başlık ve kitap açıklaması en kritik alandır çünkü Amazon algoritması '
    'bu alanlardaki kelimelere bakarak kitabı sınıflandırıyor ve potansiyel okurlarına gösteriyor. Başlık kitabın ne hakkında '
    'olduğunu tek cümlede anlatmalı — belirsiz ya da sadece yaratıcı başlıklar arama trafiğini öldürür. Örneğin \'Dijital '
    'Özgürlük\' yerine \'Freelance Hayata Geçiş: 90 Günde Kurumsal İşten Bağımsız Kariyere\' çok daha güçlü bir başlıktır. '
    'Alt başlık varsa hedef kitleyi veya vaadi netleştirmeli; okura \'bu kitap senin için mi?\' sorusunu yanıtlatmalı. '
    'Açıklamanın ilk iki cümlesi en kritik alan: birçok platformda açıklamanın tamamı görünmez, yalnızca ilk kırk-elli kelime '
    'ekranda yer alır. \'Bu kitapta X öğreneceksin\' ile başlamak yerine okurda bir tanıma anı yaratan bir cümle dene: '
    '\'Her sabah işe gitmeye zorlanıyorsan, bu kitap tam senin için.\' Kullandığın anahtar kelimelerin başlık ve açıklamada '
    'doğal biçimde geçmesi hem arama sıralamasına hem de okur güvenine katkı sağlar."],'
)

# Section: Kategori ve anahtar kelimeler
old1_s2 = (
    '      ["Kategori ve anahtar kelimeler seçildi mi?", "KDP iki kategori ve yedi anahtar kelime seçmenize izin veriyor. '
    'Kategori seçimi hem keşfedilirliği hem de en çok satanlar sıralamasını etkiliyor. Rekabeti düşük, ilgili bir alt '
    'kategoride yer almak ana kategoride kaybolmaktan çok daha değerlidir. Anahtar kelimeler için gerçek okur aramalarını '
    'düşün — jargon değil, birinin Amazon arama kutusuna ne yazacağını tahmin et. Bu alanda küçük bir araştırma, organik '
    'erişimde büyük fark yaratır."],'
)
new1_s2 = (
    '      ["Kategori ve anahtar kelimeler seçildi mi?", "KDP iki kategori ve yedi anahtar kelime seçmenize izin veriyor — '
    'bu alanları boş bırakmak ya da rastgele doldurmak ciddi bir keşfedilirlik kaybıdır. Kategori seçimi hem organik arama '
    'görünürlüğünü hem de \'En Çok Satanlar\' rozet olasılığını doğrudan etkiliyor. Ana kategoride yüzlerce kitabın arasında '
    'kaybolmak yerine, daha küçük ama ilgili bir alt kategoride yer almak çok daha değerlidir. Örneğin \'İş ve Kariyer\' gibi '
    'geniş bir kategori yerine \'Serbest Çalışma ve Fiyatlandırma Stratejileri\' gibi niş bir alt kategori, ilk aylarda '
    'rakiplerinden sıyrılmana yardımcı olur. Anahtar kelimeler için jargon değil, gerçek okur aramaları düşün: bir kişi Amazon '
    'arama kutusuna ne yazar? Bu soruyu yanıtlamak için Amazon\'un otomatik tamamlama önerilerini kullan — ücretsiz ve doğrudan '
    'gerçek kullanıcı davranışından besleniyor. Bu alanda on dakika harcamak, kitabın aylarca organik erişim farkı yaratabilir."],'
)

# Section: İçerik akışı temiz mi?
old1_s3 = (
    '      ["İçerik akışı temiz mi?", "Bölüm sırası mantıklı mı? Her bölüm öncekinin üzerine inşa ediyor mu? Tekrar eden '
    'paragraflar, yarım kalan başlıklar veya bağlamdan kopuk bölümler var mı? Kitabı en başından sonuna hızlıca tarayarak '
    'yapısal sorunları yakala. Cümle cümle okumak gerekmez — sadece bölüm başlıklarını ve her bölümün ilk cümlesini kontrol '
    'etmek bile akış sorunlarını görmenizi sağlar. Özellikle AI taslağından gelen içeriklerde aynı fikrin farklı bölümlerde '
    'tekrar ettiği görülebilir."],'
)
new1_s3 = (
    '      ["İçerik akışı temiz mi?", "Yükleme öncesi içerik kontrolü kelime kelime düzeltme anlamına gelmiyor — asıl hedef '
    'yapısal sorunları yakalamak. Önce bölüm başlıklarına bak: sırayla okuyunca bir mantık akışı görüyor musun? Her bölüm bir '
    'öncekinin üzerine inşa ediyor mu, yoksa birbirinden bağımsız parçalar mı sıralanmış? Sonra her bölümün yalnızca ilk '
    'cümlesini oku: bölüm ne hakkında olduğunu ilk cümlede net söylüyor mu? Bu hızlı tarama, bağlamdan kopuk bölümleri ve '
    'gereksiz tekrarları çoğu zaman saniyeler içinde ortaya çıkarır. Özellikle AI taslağından üretilen içeriklerde aynı fikrin '
    'farklı bölümlerde farklı kelimelerle yinelendiği sık görülür. Bir de \'bunu çıkarırsam okur ne kaybeder?\' testini uygula: '
    'eğer bir bölümü çıkardığında kitap daha akıcı okunuyorsa o bölüm muhtemelen gereksizdir. Temiz bir akış iade oranını '
    'düşürür ve olumlu yorum alma ihtimalini artırır."],'
)

# Section: Kapak KDP gereksinimlerini
old1_s4 = (
    '      ["Kapak KDP gereksinimlerini karşılıyor mu?", "KDP dijital kitap kapağı için minimum 1000 piksel genişlik, ideal '
    '2560x1600 piksel ve 1.6:1 en boy oranı istiyor. Baskılı kitap için ise ön kapak, arka kapak ve sırt birleşik tek PDF '
    'olarak hazırlanmalı — boyutlar sayfa sayısına göre değişiyor. Kapağın küçük thumbnail görünümünde bile başlığın okunabilir '
    'olması kritik: Kindle listelerinde kitabın küçücük bir kare olarak göründüğünü unutma. Kapak türe uygun mu? Rehber, iş veya '
    'eğitim kitabı görünümü profesyonellik sinyali veriyor."],'
)
new1_s4 = (
    '      ["Kapak KDP gereksinimlerini karşılıyor mu?", "KDP dijital kitap kapağı için minimum 1000 piksel genişlik, ideal '
    '2560x1600 piksel çözünürlük ve 1.6:1 en boy oranı gerektiriyor. Bu şartları karşılamayan kapaklar ya yükleme sırasında '
    'reddediliyor ya da platformda bulanık ve pikselleşmiş görünüyor — her iki durum da profesyonellik algısını anında zedeliyor. '
    'Baskılı kitap için ön kapak, arka kapak ve sırt birleşik tek PDF olarak hazırlanmalı; sırt genişliği sayfa sayısına göre '
    'değişiyor ve KDP\'nin şablon hesap aracını kullanmak zorunlu. Kapağı yüklemeden önce küçük thumbnail boyutuna indirip '
    'başlığın hâlâ okunabilir olup olmadığını test et. Kindle mağazasında kitaplar liste görünümünde küçücük bir kare olarak '
    'görünüyor; bu boyutta başlık seçilemeyen kapaklar tıklanma almıyor. Kapak türle de uyuşmalı: rehber ve iş kitabı görünümü '
    '— temiz zemin, tipografi ağırlıklı, minimal ikon — güven sinyali verirken kurgu kapağı gibi tasarlanmış bir non-fiction '
    'kapak okuru şaşırtır ve dönüşümü düşürür."],'
)

# Section: Dosya teknik olarak
old1_s5 = (
    '      ["Dosya teknik olarak sorunsuz mu?", "EPUB yüklemeden önce bir doğrulama aracıyla kontrol etmek iyi bir alışkanlık. '
    'KDP kendi önizleme aracına sahip — Kindle Previewer veya tarayıcı tabanlı önizleme. İçindekiler tablosu doğru linkleri '
    'gösteriyor mu? Görseller düzgün yükleniyor mu? Font\'lar gömülü mü? Bu kontrolü yapmadan yükleme yapıp sonra hata '
    'bildirimi almak süreci uzatır. Book Generator çıktıları platform uyumlu üretir ama son kontrolü yine de yapmak iyi pratik."],'
)
new1_s5 = (
    '      ["Dosya teknik olarak sorunsuz mu?", "EPUB dosyasını KDP\'ye yüklemeden önce Kindle Previewer uygulamasıyla ya da '
    'tarayıcı tabanlı KDP önizleme aracıyla test etmek ciddi sorunları erkenden yakalamanı sağlar. Kontrol edilmesi gereken '
    'başlıca noktalar: İçindekiler tablosu doğru bölümlere link veriyor mu? Her bölüm başlığı gerçekten yeni bir sayfada '
    'başlıyor mu? Görseller varsa tüm cihazlarda düzgün görünüyor mu? Fontlar EPUB dosyasına gömülü mü? Bu son nokta özellikle '
    'önemli: gömülü olmayan fontlar farklı cihazlarda öngörülemeyen görünümler üretiyor ve okuma deneyimini bozuyor. Eğer '
    'baskılı kitap için PDF yüklüyorsan kenar boşluklarının, trim size ayarının ve bleed değerlerinin KDP şartname sayfasındaki '
    'ölçülerle uyuştuğundan emin ol. Book Generator çıktıları platform uyumlu üretir ama son doğrulamayı yapmak iyi pratik — '
    'bu beş dakikalık kontrol, ilerleyen dönemde saatlik düzeltme turlarının önüne geçer."],'
)

# Section: Yayın öncesi son tur
old1_s6 = (
    '      ["Yayın öncesi son tur", "Yukarıdaki beş kontrol tamamsa bir adım daha: kitabı KDP önizleyicisinde gözden geçir. '
    'Asıl okuma deneyimini simüle eder. Sayfa geçişleri, bölüm başları ve genel görünüm burada netleşir. Küçük sorunlar '
    'düzeltme döngüsü gerektirmez — direkt güncelleme yükleyebilirsin. Ama büyük yapısal sorunları yayın sonrası fark etmek '
    'hem zaman kaybettirir hem de ilk izlenimleri bozabilir. Beş dakika harcayıp kontrol et, sonra yayınla."],'
)
new1_s6 = (
    '      ["Yayın öncesi son tur", "Beş kontrol tamamlandıktan sonra bir adım daha: kitabı KDP\'nin Kindle Previewer aracında '
    'baştan sona gözden geçir. Bu araç üç farklı cihaz görünümü sunuyor — telefon, tablet ve e-ink okuyucu. Kitabın üç '
    'görünümde de okunabilir ve tutarlı görünmesi yayın kalitesinin temel ölçütü. Sayfa geçişlerinde garip atlama oluyor mu? '
    'Bölüm başları her zaman yeni sayfada mı açılıyor? Özel karakterler ya da liste maddeleri doğru görünüyor mu? Bu turda '
    'gördüğün küçük sorunları düzeltmek için kitabı tekrar yüklemene gerek yok — dosyayı düzeltip yeni sürümü yükleyebilirsin, '
    'yayınlanmış kitabı da sonradan güncelleyebilirsin. Ama büyük yapısal sorunları yayın sonrası fark etmek hem erken alınan '
    'olumsuz yorumlar hem de ilk izlenim kaybı açısından maliyetlidir. Bu son tura on dakika ayır; mükemmel olmak zorunda '
    'değil, yayınlanmaya hazır olmak yeterli."],'
)

# Apply KDP replacements
for old, new, label in [
    (old1_intro, new1_intro, "kdp_intro"),
    (old1_s1, new1_s1, "kdp_s1"),
    (old1_s2, new1_s2, "kdp_s2"),
    (old1_s3, new1_s3, "kdp_s3"),
    (old1_s4, new1_s4, "kdp_s4"),
    (old1_s5, new1_s5, "kdp_s5"),
    (old1_s6, new1_s6, "kdp_s6"),
]:
    if old in content:
        content = content.replace(old, new, 1)
        print(f"  OK: {label}")
    else:
        print(f"  MISS: {label}")

# ============================================================
# 2. yazmayi-bilmeden-kitap-cikarabilir-miyim
# ============================================================

old2_intro = (
    '    intro: "Bu soruyu soran herkes aynı noktada takılır: yazmak zor bir beceri gibi görünür, aylarca pratik gerektirir, '
    'belki de herkese göre değildir. Ama gerçekte çoğu insan yazarlıktan değil, başlamaktan korkuyor. Ve başlamak için '
    'mükemmel bir yazar olmana gerek yok.",'
)
new2_intro = (
    '    intro: "Bu soruyu soran herkes aynı noktada takılır: yazmak zor bir beceri gibi görünür, aylarca pratik gerektirir, '
    'belki de herkese göre değildir. Oysa rehber kitap ve bilgi kitabı yazmak, edebi roman yazmaktan bambayla farklı bir iştir. '
    'Burada güzel cümleler değil, net bilgi ve doğru yapı önemlidir. Gerçekte çoğu insan yazarlıktan değil, başlamaktan '
    'korkuyor — ve başlamak için mükemmel bir yazar olmana hiç gerek yok. Doğru bir araç ve net bir konu, seni beklediğinden '
    'çok daha hızlı bir kitap sahibi yapabilir.",'
)

old2_s1 = (
    '      ["Yazarlık korkusu gerçek mi?", "Evet, gerçek — ama çoğu zaman yanlış kaynaktan geliyor. İnsanlar \'iyi bir yazar '
    'olmam lazım\' diye düşünür. Oysa bilgi kitabı yazarlığı edebi bir roman yazmaktan çok farklıdır. Rehber kitapta okur '
    'senden güzel cümleler değil, net bilgi ve pratik yönlendirme bekler. Zaten bildiğin bir konuda birikimini aktarıyorsun '
    '— bu konuşmaktan pek farklı değil. Farklılık sadece yapıda: kitap, konuşmayı belirli bir sıraya sokar."],'
)
new2_s1 = (
    '      ["Yazarlık korkusu gerçek mi?", "Evet, gerçek — ama çoğu zaman yanlış kaynaktan geliyor. İnsanlar \'iyi bir yazar '
    'olmam lazım\' diye düşünür; bu düşünce başlamalarını engelleyen en büyük mentol bloğa dönüşür. Oysa bilgi kitabı '
    'yazarlığı edebi bir roman yazmaktan tamamen farklıdır. Bir romanda üslup, dil zenginliği ve kurgusal yaratıcılık '
    'merkezde yer alır. Rehber kitapta ise okur senden güzel cümleler değil, net bilgi ve pratik yönlendirme bekler. '
    'Zaten bildiğin bir konuda birikimini aktarıyorsun — bu bir arkadaşına bir şeyi anlatmaktan pek farklı değil. Bir '
    'koç, danışman ya da deneyimli bir uygulayıcı olarak zaten sahip olduğun bilgiyi kağıda dökmek yazarlık değil, '
    'aktarım becerisidir. Farklılık sadece yapıda: kitap, konuşmayı belirli bir sıraya sokar ve okura adım adım ilerler. '
    'Bu yapıyı kurmak için de çok güçlü bir yazar olmak gerekmez."],'
)

old2_s2 = (
    '      ["Yazmak ile yönlendirmek farkı", "Geleneksel kitap yazımında her kelimeyi sen üretirsin. AI destekli kitap '
    'üretiminde ise rolün değişiyor: sen yönlendiriyorsun, sistem taslak üretiyor, sen düzenliyorsun. Bu süreçte yazarlık '
    'becerisi değil, içerik kararları alabilmek önemli. Konu ne olacak? Hangi bölümler olacak? Hangi örnekler verilecek? '
    'Bu soruları cevaplayabiliyorsan kitap yazabilirsin. Cümleleri mükemmel kurmak zorunda değilsin — taslağı görüp \'bu '
    'doğru mu, eksik mi, değişmeli mi\' diyebilmek yeterli."],'
)
new2_s2 = (
    '      ["Yazmak ile yönlendirmek farkı", "Geleneksel kitap yazımında her kelimeyi sen üretirsin — boş sayfayla başlarsın, '
    'her cümle senden çıkar, her paragraf senin emeğindir. AI destekli kitap üretiminde ise rolün köklü biçimde değişiyor: '
    'sen yönlendiriyorsun, sistem taslak üretiyor, sen düzenliyorsun. Bu süreçte yazarlık becerisi değil, içerik kararları '
    'alabilmek önemli. Konu ne olacak? Hangi bölümler olacak? Hangi örnekler verilecek? Hangi ton kullanılacak? Bu soruları '
    'cevaplayabiliyorsan kitap üretebilirsin. Cümleleri mükemmel kurmak zorunda değilsin — taslağı görüp \'bu doğru mu, eksik '
    'mi, değişmeli mi?\' diyebilmek yeterli. Bu rol bir editöre ya da proje yöneticisine benziyor: nihai kararlar sende, '
    'üretim ağırlığı araçta. Yazarlık korkusunu bu zihinsel çerçeve ile ele almak, çoğu insanın ilk adımı atmasını kolaylaştırıyor."],'
)

old2_s3 = (
    '      ["AI aracın rolü nedir?", "Book Generator gibi araçlar seni boş sayfayla başa başa bırakmaz. Konu, hedef okur ve '
    'ton bilgilerini girdiğinde sistem bir outline önerir. Outline\'ı onayladığında bölüm içeriklerini üretir. Her aşamada '
    'sana düzenleme, yeniden üretim veya elle yazma seçeneği sunar. Araç bir taslak makinesidir — kaba heykel seni bekliyor, '
    'sen son şekli veriyorsun. Bu süreçte \'yazarlık\' değil, içerik editörlüğü yapıyorsun."],'
)
new2_s3 = (
    '      ["AI aracın rolü nedir?", "Book Generator gibi araçlar seni boş sayfayla başa başa bırakmaz. Konu, hedef okur ve '
    'ton bilgilerini girdiğinde sistem bir outline önerir — bölüm başlıkları, önerilen sıralama ve genel yapıyla birlikte. '
    'Outline\'ı onayladığında bölüm içeriklerini üretir; her bölümü ayrı ayrı gözden geçirip düzenleyebilirsin. Her aşamada '
    'sana düzenleme, yeniden üretim veya elle yazma seçeneği sunar. Araç bir taslak makinesidir — heykel kaba halde seni '
    'bekliyor, sen son şekli veriyorsun. Bu süreçte \'yazarlık\' değil, içerik editörlüğü yapıyorsun: hangi bölüm kalacak, '
    'hangi cümle değişecek, hangi örnek daha somut hale getirilecek? Bu kararlar senin uzmanlığını yansıtıyor. Araç sadece '
    'taslağı hızlı kuruyor; kitabın kalitesi senin düzenleme gözüne ve konu bilgine bağlı."],'
)

old2_s4 = (
    '      ["Sihirbaz akışı neden fark yaratıyor?", "İlk kullanıcının en büyük engeli boş ekrandır. Neyi soracağını '
    'bilmeden, nereden başlayacağını bilmeden geçen her dakika motivasyonu düşürür. Wizard akışı bu engeli ortadan kaldırır: '
    'sana sırayla sorular sorar, cevaplarına göre ilerler. Konu ne? Hedef okur kim? Kitap kaç bölüm olsun? Ton nasıl olsun? '
    'Bu soruları cevapladığında zaten bir taslağın var. Boş ekranda sıfırdan başlamak yerine hazır bir yapıyla başlamak, '
    'özellikle ilk kitabında devasa bir fark yaratır."],'
)
new2_s4 = (
    '      ["Sihirbaz akışı neden fark yaratıyor?", "İlk kullanıcının en büyük engeli boş ekrandır. \'Nereden başlayayım?\' '
    'sorusu cevapsız kaldığında insanlar ya mükemmeliyetçilikle felç oluyor ya da süreci sonsuza erteliyor. Neyi soracağını '
    'bilmeden, nereden başlayacağını bilmeden geçen her dakika motivasyonu düşürür. Wizard akışı bu engeli ortadan kaldırır: '
    'sana sırayla yönlendirilmiş sorular sorar, cevaplarına göre ilerler. Konu ne? Hedef okur kim? Kitap kaç bölüm olsun? '
    'Ton nasıl olsun? Bu soruları cevapladığında sistemin elinde bir brief var — ve kısa sürede sana bir taslak sunuyor. '
    'Boş ekranda sıfırdan başlamak yerine hazır bir yapıyla başlamak, özellikle ilk kitabında devasa bir fark yaratır. '
    'Düzeltmek, sıfırdan kurmaktan her zaman daha kolaydır. Wizard seni bu noktaya taşıyor."],'
)

old2_s5 = (
    '      ["Net amaç mükemmel prompttan üstündür", "AI araçlarıyla çalışırken en sık duyulan tavsiye daha iyi prompt '
    'yazmak olur. Ama gerçekte asıl fark yaratan şey prompt kalitesi değil, içerik netliğidir. Ne anlatmak istediğini '
    'biliyorsan, kime yazıyorsun biliyorsan, kitabın sonunda okur ne kazanacak biliyorsan — sistem bunu çok daha iyi bir '
    'çıktıya dönüştürebilir. Teknik prompt becerisine ihtiyaç duymadan, sadece konunu ve amacını net biçimde ifade ederek '
    'çok iyi sonuçlar alabilirsin."],'
)
new2_s5 = (
    '      ["Net amaç mükemmel prompttan üstündür", "AI araçlarıyla çalışırken en sık duyulan tavsiye daha iyi prompt '
    'yazmak olur — \'doğru prompt yazmasını bilmiyorum\' kaygısı, başlamayı engelleyen bir başka duvar haline gelir. Ama '
    'gerçekte asıl fark yaratan şey teknik prompt becerisi değil, içerik netliğidir. Şu üç soruya cevap verebildiğinde '
    'sistem zaten çok daha iyi çalışır: Ne anlatmak istiyorum? Kime yazıyorum? Kitabı bitiren okur ne yapabilecek ya da '
    'ne bilecek? Bu sorulara net cevabın varsa, sistem bunu işlevsel bir kitap yapısına dönüştürebilir. Teknik prompt '
    'becerisine ihtiyaç duymadan, sadece konunu ve amacını samimi biçimde ifade ederek çok iyi sonuçlar alabilirsin. '
    'Prompt mühendisliği değil, içerik sahibi olmak asıl güç kaynağı."],'
)

old2_s6 = (
    '      ["İlk adımı atmak için ne lazım?", "Sadece bir konu. Ve o konuda başkasına anlatabilecek bir şeyin olması. '
    'Yazarlık deneyimine, İngilizce bilgisine ya da yayıncılık sektörü hakkında bilgiye ihtiyacın yok. Book Generator '
    'Türkçe arayüzle çalışır ve kitabı istediğin dilde üretir. Kayıt olmadan başlayabilirsin — konu girişi yap, 30 '
    'saniyede outline ve kapak önizlemeni gör. Beğenmediysen geri dön ve değiştir. Risk yok, boş sayfa yok."],'
)
new2_s6 = (
    '      ["İlk adımı atmak için ne lazım?", "Sadece bir konu. Ve o konuda başkasına anlatabilecek bir şeyin olması — '
    'yıllar içinde öğrendiğin bir beceri, defalarca yaşadığın bir süreç, sürekli soru aldığın bir alan. Yazarlık '
    'deneyimine, akıcı bir İngilizceye ya da yayıncılık sektörü hakkında uzmanlığa ihtiyacın yok. Book Generator Türkçe '
    'arayüzle çalışır ve kitabı istediğin dilde üretir — Türkçe brief gir, İngilizce kitap çıkar. Kayıt olmadan '
    'başlayabilirsin: konu girişi yap, 30 saniyede outline ve kapak önizlemeni gör. Beğenmediysen geri dön, konuyu '
    'değiştir, farklı bir yön dene. Risk yok, boş sayfa yok, ön bilgi şartı yok. Yazarlık korkusunu aşmanın en iyi '
    'yolu tartışmak değil, bir taslak görmektir — ve bunu görmek için sadece bir konu girmen yeterli."],'
)

for old, new, label in [
    (old2_intro, new2_intro, "yaz_intro"),
    (old2_s1, new2_s1, "yaz_s1"),
    (old2_s2, new2_s2, "yaz_s2"),
    (old2_s3, new2_s3, "yaz_s3"),
    (old2_s4, new2_s4, "yaz_s4"),
    (old2_s5, new2_s5, "yaz_s5"),
    (old2_s6, new2_s6, "yaz_s6"),
]:
    if old in content:
        content = content.replace(old, new, 1)
        print(f"  OK: {label}")
    else:
        print(f"  MISS: {label}")

# ============================================================
# 3. kitap-fikri-nasil-secilir
# ============================================================

old3_intro = (
    '    intro: "Kitap fikri bulmak çoğu zaman ilham beklemek gibi hissettirir — bir gün doğru konu kendiliğinden gelecek. '
    'Ama en iyi kitap fikirleri ilhamdan değil, net bir okur ihtiyacıyla örtüşen gerçek bir uzmanlıktan doğar. Bu yazı, '
    'konu seçimini sezgiden çıkarıp sistematik bir karar sürecine taşımanı sağlıyor.",'
)
new3_intro = (
    '    intro: "Kitap fikri bulmak çoğu zaman ilham beklemek gibi hissettirir — bir gün doğru konu kendiliğinden gelecek. '
    'Bu bekleme, çoğu zaman kitabın hiç yazılmamasıyla sonuçlanır. Oysa en iyi kitap fikirleri ilhamdan değil, net bir okur '
    'ihtiyacıyla örtüşen gerçek bir uzmanlıktan doğar. Konu seçimi bir estetik karar değil, stratejik bir karardır: doğru '
    'konuyu seçen yazar hem yazmakta zorlanmaz hem de kitabını satmakta. Bu yazı, konu seçimini sezgiden çıkarıp somut '
    'verilere dayanan sistematik bir karar sürecine taşımanı sağlıyor.",'
)

old3_s1 = (
    '      ["Neden konu seçimi bu kadar önemli?", "Yanlış konuyla başlamak, kitabın her aşamasını zorlaştırır. İçerik '
    'dağınık olur, okur kitlesi belirsizleşir, pazarlama mesajı tutarsızlaşır. Öte yandan doğru konu seçimi her şeyi '
    'kolaylaştırır: bölüm yapısı kendiliğinden oturur, örnekler aklına daha hızlı gelir, okura hitap etmek kolaylaşır. '
    'Konu seçiminde iki temel soru var: bu konuda gerçekten bir şeyler biliyor musun, ve bu konuyu arayan gerçek bir '
    'kitle var mı?"],'
)
new3_s1 = (
    '      ["Neden konu seçimi bu kadar önemli?", "Yanlış konuyla başlamak, kitabın her aşamasını zorlaştırır. İçerik '
    'dağınık olur çünkü sınırları belli olmayan bir konuyu yapılandırmak güçtür; okur kitlesi belirsizleşir çünkü herkese '
    'hitap etmeye çalışan kitap kimseye tam olarak hitap edemez; pazarlama mesajı tutarsızlaşır çünkü kitabın ne vaddettiği '
    'net değildir. Öte yandan doğru konu seçimi her şeyi kolaylaştırır: bölüm yapısı kendiliğinden oturur, örnekler aklına '
    'daha hızlı gelir, okura hitap etmek kolaylaşır, ve kitabı bitirme motivasyonu yüksek kalır. Konu seçiminde iki temel '
    'soru sorulmalı: Bu konuda gerçekten derinlemesine bir şeyler biliyor musun? Ve bu konuyu arayan, bu soruya para harcamaya '
    'hazır gerçek bir kitle var mı? Her ikisine de evet diyebiliyorsan sağlam bir başlangıç noktasındasın."],'
)

old3_s2 = (
    '      ["Bildiğin şeyi seç", "Uzmanlık ya da deneyim temeli olmayan konular, içerik derinliğini hızla düşürür. Genel '
    'bilgilerden oluşan bir kitap okuyucuya değer katmaz — çünkü okur aynı bilgiyi internette ücretsiz bulabilir. Ama kendi '
    'deneyiminden süzülmüş, gerçek örneklerle desteklenmiş, bir alanda defalarca karşılaşılan sorunlara verilen cevaplardan '
    'oluşan bir kitap çok daha değerlidir. Yazmak istediğin konuda başkasına öğretebileceğin, danışılan biri olduğun, gerçek '
    'sonuçlar ürettiğin bir alanı seç."],'
)
new3_s2 = (
    '      ["Bildiğin şeyi seç", "Uzmanlık ya da deneyim temeli olmayan konular, içerik derinliğini hızla düşürür. Genel '
    'bilgilerden oluşan, internette zaten bulunan bilgileri tekrar eden bir kitap okuyucuya değer katmaz. Okur neden parasını '
    've zamanını harcasın? Ama kendi deneyiminden süzülmüş, gerçek örneklerle desteklenmiş, bir alanda defalarca karşılaşılan '
    'sorunlara gerçek cevaplar veren bir kitap çok daha güçlüdür. Örneğin, yıllarca e-ticaret işleten biri \'Dropshipping '
    'Nedir?\' değil, \'İlk Siparişten Önce Yapmanız Gereken 7 Tedarikçi Testi\' gibi spesifik ve deneyim temelli bir kitap '
    'yazabilir — bu kitabın değeri, birinin araştırıp derlediği bilgiden çok daha yüksektir. Yazmak istediğin konuda '
    'başkasına öğretebileceğin, insanların sana danıştığı, gerçek sonuçlar ürettiğin bir alanı seç. Bu alan senin '
    'rakipsiz avantajın."],'
)

old3_s3 = (
    '      ["Sorun odaklı düşün", "İnsanlar kitap satın alırken genellikle bir sorunu çözmeye ya da bir hedefe ulaşmaya '
    'çalışıyorlar. \'Fotoğrafçılık üzerine kitap\' yerine \'ışık koşulları zor olan mekânlarda doğal portre fotoğrafı nasıl '
    'çekilir\' çok daha güçlü bir konu. Konu ne kadar spesifik ve ne kadar somut bir sorunu çözüyorsa hedef okurla o kadar '
    'hızlı bağ kurar. Konunu belirlerken şu soruyu sor: \'Bu kitabı kim okur ve okuduktan sonra ne yapabilecek?\'"],'
)
new3_s3 = (
    '      ["Sorun odaklı düşün", "İnsanlar kitap satın alırken genellikle iki şeyden biri için ödeme yapıyor: bir sorunu '
    'çözmek ya da bir hedefe ulaşmak. Bu yüzden en çok satan non-fiction kitaplar çoğunlukla net bir problemi ele alan '
    'kitaplardır. \'Fotoğrafçılık üzerine bir kitap\' geniş ve belirsizdir — ama \'Düşük Işıkta Çekim: Ekstra Ekipman '
    'Olmadan Profesyonel Sonuç\' çok daha güçlü ve hedefe yönelik bir konudur. Konu ne kadar spesifik ve ne kadar somut '
    'bir sorunu çözüyorsa hedef okurla o kadar hızlı bağ kurar. Konunu belirlerken şu iki soruyu sor: \'Bu kitabı kim '
    'okur?\' ve \'Okuduktan sonra ne yapabilecek ya da ne bilecek?\' Bu iki soruya net cevap verebildiğinde konu hem '
    'içerik üretimi hem de pazarlama açısından çok daha güçlü hale gelir. Belirsiz konu, belirsiz okur, belirsiz satış '
    'anlamına gelir."],'
)

old3_s4 = (
    '      ["Pazar talebini nasıl ölçersin?", "İyi bir fikrin gerçek talep bulduğundan emin olmak için birkaç pratik '
    'yöntem var. Amazon\'da konuya yakın kitaplara bak: kaç başlık var, en iyi satanların yorumları ne diyor, okurların '
    'beğendiği ve şikayet ettiği noktalar neler? Bu yorumlar hem konunun ilgi gördüğünü kanıtlar hem de kitabında neye '
    'odaklanman gerektiğini gösterir. Google Trends\'te konunun arama trendini kontrol et. Reddit ve Quora\'da insanların '
    'bu konuda hangi soruları sorduğuna bak."],'
)
new3_s4 = (
    '      ["Pazar talebini nasıl ölçersin?", "İyi bir fikrin gerçek talep bulduğundan emin olmak için harcayabileceğin '
    'iki-üç saat, sonraki aylardaki satış hayal kırıklığının önüne geçer. Amazon\'da konuya yakın kitaplara bak: kaç '
    'başlık var, bu kitaplar ne zaman yayınlandı, en iyi satanların yorumlarında okurlar neyi beğeniyor ve neyi '
    'eleştiriyor? Yorumlar son derece değerli bir veri kaynağıdır: okurların beğenmediği eksiklikler senin kitabının '
    'fırsatıdır. Google Trends\'te konunun arama hacmini ve trend yönünü kontrol et — artıyor mu, azalıyor mu, mevsimsel '
    'mi? Reddit ve Quora\'da insanların bu konuda hangi soruları sorduğuna bak: insanların sormaktan çekinmediği sorular, '
    'gerçek bilgi açığını gösterir. Bu araştırmayı yapmadan konuna karar vermek, gözleri kapalı bir işe girişmek gibidir."],'
)

old3_s5 = (
    '      ["KDP keyword araştırması", "Amazon KDP\'de yayın yapmayı düşünüyorsan keyword araştırması kritik öneme '
    'sahip. KDP\'de anahtar kelimeler hem arama sonuçlarında görünürlüğü hem de kategori sıralamasını etkiler. Ücretsiz '
    'araçlar için Amazon\'un kendi arama çubuğunu kullan: bir konu girdiğinde önerilen aramalar, gerçek kullanıcıların '
    'ne aradığını gösterir. Publisher Rocket veya Book Bolt gibi ücretli araçlar daha detaylı hacim ve rekabet verisi '
    'sunar. Hedef, düşük rekabetli ama yeterli hacme sahip anahtar kelimeleri bulmaktır."],'
)
new3_s5 = (
    '      ["KDP keyword araştırması", "Amazon KDP\'de yayın yapmayı düşünüyorsan keyword araştırması, konu seçimi '
    'sürecinin ayrılmaz bir parçası olmalı. KDP\'de anahtar kelimeler hem arama sonuçlarında görünürlüğü hem de kategori '
    'sıralamasını doğrudan etkiler. Ücretsiz ve etkili bir başlangıç için Amazon\'un kendi arama çubuğunu kullan: '
    'konuyla ilgili bir kelime girdiğinde çıkan otomatik tamamlama önerileri, gerçek kullanıcıların ne aradığını '
    'yansıtır. Bu öneriler hem popüler aramaları hem de henüz kitapların az olduğu niş alıları gösterebilir. Daha '
    'derinlemesine araştırma için Publisher Rocket, Book Bolt veya Helium 10 gibi araçlar aylık arama hacmi ve rekabet '
    'yoğunluğu verisi sunar. Hedef şudur: yeterince aranıyor ama yeterince rakip kitap yok. Bu kesişim noktası, yeni '
    'bir kitabın en hızlı ivme kazanabileceği alandır. Keyword araştırmasını konu seçiminin önüne koymak yerine '
    'seçimin teyidi olarak kullanmak en sağlıklı yaklaşımdır."],'
)

old3_s6 = (
    '      ["Rekabeti doğru değerlendirmek", "Yüzlerce kitabın olduğu bir niş kötü işaret değildir — aksine talebin '
    'kanıtıdır. Ama bu nişte sıyrılmak için farklı bir açı sunman gerekir. Rakip kitaplardaki en sık şikayetlere bak: '
    'okurlar ne eksik buluyor, hangi soruları cevaplanmamış kalıyor, hangi örnekler çok teorik kalıyor? Bu boşluklar '
    'senin fırsatın. Hiç rakibin olmayan niş ise tehlikeli olabilir — ya talep yok ya da kimse o konuya para harcamak '
    'istemiyor."],'
)
new3_s6 = (
    '      ["Rekabeti doğru değerlendirmek", "Yüzlerce kitabın olduğu bir niş kötü işaret değildir — aksine talebin '
    'güçlü kanıtıdır. İnsanlar o konuya para harcıyor demektir. Ama bu nişte sıyrılmak için farklı bir açı sunman '
    'gerekir. Rakip kitaplardaki bir yıldız ve iki yıldız yorumlarına özellikle dikkat et: okurlar ne eksik buluyor, '
    'hangi sorular cevaplanmamış kalıyor, hangi bölümler çok teorik ya da çok yüzeysel bulunuyor? Bu şikayetler '
    'senin kitabının vaat cümlesi haline gelir: \'Rakiplerin üç yıldız aldığı sorunu ben çözüyorum.\' Örneğin, '
    'muhasebe yazılımları hakkında çok kitap var ama hepsi teorik kalıyorsa, sen \'Serbest Çalışanlar İçin '
    'Pratik Muhasebe: Yazılım Adım Adım\' başlığıyla o boşluğu doldurabilirsin. Hiç rakibin olmayan niş ise '
    'gerçekten tehlikeli olabilir — ya talep yok ya da kimse o konuya para harcamak istemiyor. İkisi de iyi '
    'senaryo değil."],'
)

old3_s7 = (
    '      ["Son karar: sezgi mi, veri mi?", "İkisi birden. Veri talep olduğunu kanıtlar, sezgi ise gerçekten iyi '
    'bir kitap yazıp yazamayacağını gösterir. Verisi güçlü ama hiç ilgini çekmeyen bir konuyu seçersen içerik süreci '
    'zorlanır. İlgini çeken ama talebini doğrulayamadığın bir konuyu seçersen satış hayal kırıklığı yaratır. İkisinin '
    'kesiştiği nokta, bilgi ve tutku sahibi olduğun ve gerçek bir okur kitlesinin aradığı konudur. Book Generator '
    'araştırma merkezi bu süreçte konu ve keyword analizinde destek sunar."],'
)
new3_s7 = (
    '      ["Son karar: sezgi mi, veri mi?", "İkisi birden — ama ikisi de tek başına yeterli değil. Veri talep '
    'olduğunu kanıtlar ve hangi konunun daha fazla potansiyel taşıdığını gösterir. Sezgi ise o konuyu yazarken '
    'gerçekten katma değer üretip üretemeyeceğini, süreçte motivasyonu koruyup koruyamayacağını ortaya koyar. '
    'Verisi güçlü ama hiç ilgini çekmeyen bir konuyu seçersen içerik üretimi sıkıcı ve zorlayıcı bir hal alır — '
    'çoğunlukla yarım kalır. İlgini çeken ama talebini doğrulayamadığın bir konuyu seçersen aylarca emek ver, '
    'satış hayal kırıklığıyla karşılaşırsın. İkisinin kesiştiği nokta, hem bilgi ve deneyim sahibi olduğun hem '
    'de gerçek bir okur kitlesinin arayıp para harcadığı konudur. Bu kesişimi bulmak için zaman harcamak, her '
    'şeyin geri kalanını kolaylaştırır. Book Generator araştırma merkezi bu süreçte konu belirleme ve keyword '
    'analizinde somut veri sunarak karar sürecini destekler."],'
)

for old, new, label in [
    (old3_intro, new3_intro, "fikir_intro"),
    (old3_s1, new3_s1, "fikir_s1"),
    (old3_s2, new3_s2, "fikir_s2"),
    (old3_s3, new3_s3, "fikir_s3"),
    (old3_s4, new3_s4, "fikir_s4"),
    (old3_s5, new3_s5, "fikir_s5"),
    (old3_s6, new3_s6, "fikir_s6"),
    (old3_s7, new3_s7, "fikir_s7"),
]:
    if old in content:
        content = content.replace(old, new, 1)
        print(f"  OK: {label}")
    else:
        print(f"  MISS: {label}")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("\nDone. File saved.")
