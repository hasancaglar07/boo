export const audienceGroups = [
  {
    title: "Uzmanlığını kitaba çevirmek isteyenler",
    text: "Koçlar, danışmanlar, eğitmenler ve niş alanda bilgi biriktiren profesyoneller için.",
  },
  {
    title: "İlk rehber kitabını çıkarmak isteyenler",
    text: "Tek bir konu etrafında güven veren, düzenli ve yayımlanabilir bir kitap üretmek isteyenler için.",
  },
  {
    title: "İngilizce içerik üretmek isteyenler",
    text: "Arayüz Türkçe kalsa da kitabını English olarak kurgulayıp üretebilmen için.",
  },
] as const;

export const deliverables = [
  "Başlık, alt başlık ve kitap açıklaması",
  "Bölüm bölüm taslak ve çalışma omurgası",
  "Düzenlenebilir bölüm içerikleri",
  "Kapak akışı ve çıktı dosyaları",
  "EPUB, PDF ve uygun planlarda ek formatlar",
  "Araştırma çıktıları, konu ve anahtar kelime önerileri",
] as const;

export const howItWorksSteps = [
  {
    step: "1",
    title: "Konunu anlat",
    text: "Kitap türünü, konunu ve hedef okurunu kısa cevaplarla gir. Boş sayfa yok — sihirbaz yönlendirir.",
  },
  {
    step: "2",
    title: "Başlık ve taslağı onayla",
    text: "AI başlık, alt başlık ve bölüm akışı önerir. Sen düzenler, onaylarsın — ya da sıfırdan yazarsın.",
  },
  {
    step: "3",
    title: "Kitabını üret",
    text: "Stil ve kapak yönünü seçip üretimi başlat. 10–30 saniyede ilk önizleme hazır.",
  },
  {
    step: "4",
    title: "Önizlemeyi incele",
    text: "Kapak, bölüm listesi ve ilk %20 içeriği gör. Beğenmediysen geri dön ve değiştir.",
  },
  {
    step: "5",
    title: "PDF ve EPUB'u al",
    text: "Premium'a geç, tam kitabı aç, indir. Amazon KDP veya kendi kanalına yükle.",
  },
] as const;

export const howItWorksPageSteps = [
  {
    step: "1",
    title: "Konunu anlat",
    text: "Kitap konunu, hedef okurunu ve dilini sihirbaza gir. 5 kısa soru, sıfır boş sayfa.",
  },
  {
    step: "2",
    title: "Taslağı onayla, üretimi başlat",
    text: "AI başlık, bölüm akışı ve konu özetini önerir. Sen düzenler, onaylarsın. Sonra tek tıkla tüm kitabı üretirsin.",
  },
  {
    step: "3",
    title: "EPUB ve PDF'ini al",
    text: "Önizlemeyi gör, beğenirsen tam kitabı aç. Çıktı dosyaları KDP'ye yüklemeye hazır gelir.",
  },
] as const;

export const premiumPlan = {
  id: "premium",
  name: "Tek Kitap",
  price: "$4",
  interval: "tek seferlik",
  label: "1 kitap — abonelik yok, sonsuza sahip ol",
  description: "Fikrin var, kitap mı olur diye merak ediyorsun. $4 ile tam erişim aç — taslak, tüm bölümler, kapak ve EPUB/PDF çıktısı. Bir kez öde, dosyalar senindir.",
  badge: "Dene ve karar ver",
  perUnit: null,
  features: [
    "1 tam kitap — tüm bölümler kilitsiz",
    "AI kapak üretimi — 3 stil, özel renk paleti",
    "EPUB + PDF çıktısı — KDP'ye yüklemeye hazır",
    "Çok dilli üretim (Türkçe, İngilizce ve daha fazlası)",
    "Ton ve hedef kitle ayarı (sihirbazdan)",
    "30 gün iade garantisi — risk yok",
  ],
} as const;

export const plans = [
  {
    id: "starter",
    name: "Temel",
    price: "$19",
    interval: "aylık",
    label: "Ayda 10 kitap",
    badge: null,
    perUnit: "kitap başına $1.90",
    annualMonthlyPrice: "$15",
    description: "Her ay düzenli kitap çıkar, sürecini otur ve kendi üretim ritmine gir. Başlamak için fazlasıyla yeterli.",
    features: [
      "Ayda 10 kitap üretimi",
      "Ayda 20 kapak hakkı — AI stilli, özelleştirilebilir",
      "EPUB + PDF çıktısı — her kitap için",
      "Sihirbaz ile hızlı taslak: konu → yapı → bölümler",
      "Bölüm editörü — düzenle, yeniden üret, değiştir",
      "Çok dilli kitap desteği",
      "Kitap çalışma alanı — tüm projeler tek yerde",
      "Standart email destek",
    ],
  },
  {
    id: "creator",
    name: "Yazar",
    price: "$39",
    interval: "aylık",
    label: "Ayda 30 kitap",
    badge: "En Popüler",
    perUnit: "kitap başına $1.30",
    annualMonthlyPrice: "$31",
    decoyNote: "Stüdyo'nun %37'si kadar kitap, fiyatının %49'u",
    description: "Bir niş değil birden fazla konu üret. Araştırma merkezi ile hangi kitabın satacağını bil, KDP için optimize et, hızlı büyü.",
    features: [
      "Ayda 30 kitap üretimi",
      "Ayda 60 kapak hakkı — tam özelleştirme",
      "Araştırma merkezi — KDP trend ve anahtar kelime analizi",
      "Pazar boşluğu analizi — rakip kitap taraması",
      "EPUB, PDF ve HTML çıktıları",
      "Bölüm başına yeniden üretim ve tone ayarı",
      "Çok dilli seri üretim (aynı konuyu farklı dilde yayınla)",
      "Öncelikli destek",
    ],
  },
  {
    id: "pro",
    name: "Stüdyo",
    price: "$79",
    interval: "aylık",
    label: "Ayda 80 kitap",
    badge: null,
    perUnit: "kitap başına $0.99",
    annualMonthlyPrice: "$63",
    description: "Tek bir kategoride değil, birden fazla nişte tam hızda çalış. Kapak fabrikası, seri üretim ve API ile kendi iş akışına entegre et.",
    features: [
      "Ayda 80 kitap üretimi — tam kapasite",
      "Ayda 200 kapak hakkı",
      "Tüm çıktı formatları: EPUB, PDF, HTML, Markdown",
      "Araştırma merkezi + gelişmiş KDP pazar analizi",
      "Seri ve tema bazlı toplu üretim",
      "Bölüm şablonları ve özelleştirilmiş ton profilleri",
      "API erişimi — kendi sistemlerine entegre et",
      "Öncelikli destek + özel başlangıç rehberliği",
    ],
  },
] as const;

export const faqSections = [
  {
    title: "Genel",
    items: [
      [
        "Bu ürün ne yapıyor?",
        "Fikrini alır, taslağını çıkarır, bölümleri üretir ve kitabını yayınlanabilir çıktı dosyalarına dönüştürür.",
      ],
      [
        "İngilizce içerik üretebilir miyim?",
        "Evet. Arayüz Türkçe kalır, kitap içeriği English veya seçtiğin başka dilde üretilebilir.",
      ],
      [
        "İlk kez kullanan biri bunu anlayabilir mi?",
        "Evet. Ana kullanım yolu 5 soruluk sihirbaz ve 3 temel adımdan oluşur: fikir, taslak, yayın.",
      ],
      [
        "Preview gerçekten ücretsiz mi? Kart bilgisi gerekiyor mu?",
        "Evet, tamamen ücretsiz. Kayıt veya kart bilgisi olmadan sihirbazı tamamlar, kapağını ve bölüm planını görürsün. İlk %20 içerik önizlemesi de dahil. Ödeme yalnızca tam kitabı ve çıktı dosyalarını almak istediğinde gerekiyor.",
      ],
      [
        "AI ile üretilen içerik gerçekten kullanılabilir kalitede mi?",
        "Çıkan içerik yapılandırılmış bir taslak — profesyonel editör gibi değil, ama boş sayfayla başlamak yerine düzenlenmeye hazır bir iskelet. Her bölümü değiştirebilir, yeniden üretebilir veya kendi metninle değiştirebilirsin. Bu süreçle 2 kitap Amazon KDP'de yayında.",
      ],
      [
        "Bu ürün kimin için uygun değil?",
        "Roman veya kurgu yazarları, akademik format (dipnot, kaynak listesi) arayanlar ve teknik dokümantasyon ihtiyacı olanlar için tasarlanmadı. Rehber, uzmanlık kitabı, info ürün veya KDP non-fiction için doğru araç.",
      ],
    ],
  },
  {
    title: "Kitap Üretimi",
    items: [
      [
        "Kitabı nasıl oluşturuyorum?",
        "Konu, hedef okur, ton ve dil gibi kısa bilgileri girersin. Sistem buna göre taslak ve bölüm akışını kurar.",
      ],
      [
        "Taslağı onaylamadan bölüm üretmek zorunda mıyım?",
        "Hayır. Önce taslak üzerinde karar verip sonra bölüm üretimine geçmen önerilir.",
      ],
      [
        "Kitabı sonradan düzenleyebilir miyim?",
        "Evet. Bölüm içerikleri ve kitap metadatası çalışma alanında güncellenebilir.",
      ],
      [
        "Sadece giriş veya özet gibi tek parça içerik üretebilir miyim?",
        "Ana akış tam kitap üretimine odaklıdır. Gelişmiş akışlarda belirli bölümler üzerinde de çalışabilirsin.",
      ],
      [
        "Türkçe yazıp İngilizce kitap üretebilir miyim?",
        "Evet. Sihirbazı tamamen Türkçe doldurabilirsin; sistem içeriği seçtiğin dilde — İngilizce dahil — üretir. Ayrıca çeviri araç kullanmana gerek yok. Türkçe bilgini İngilizce KDP kitabına dönüştürmek bu ürünün en güçlü kullanım senaryolarından biri.",
      ],
      [
        "Kaç bölüm üretilir? Uzunluğu kontrol edebilir miyim?",
        "Taslak aşamasında bölüm sayısını ve başlıklarını onaylarsın; sistem genelde 7–12 bölümlük taslak önerir. Bölümleri ekleyebilir, çıkarabilir veya yeniden sıralayabilirsin. Bölüm uzunluğu da ayarlanabilir bir parametre.",
      ],
    ],
  },
  {
    title: "Kapak ve Tasarım",
    items: [
      [
        "Kapak ekleyebilir miyim?",
        "Evet. Yerel kapak üretimi, manuel yükleme ve uygun akışlarda AI destekli kapak seçenekleri bulunur.",
      ],
      [
        "Arka kapak ve ek görseller destekleniyor mu?",
        "Evet. Çalışma alanındaki yayın ve varlık akışlarında ön kapak ve arka kapak dosyaları yönetilebilir.",
      ],
      [
        "Kapaklar otomatik mi oluşuyor?",
        "İstersen otomatik akış kullanılır, istersen tamamen kendi yüklediğin görsellerle ilerlersin.",
      ],
    ],
  },
  {
    title: "Teslim ve Çıktılar",
    items: [
      [
        "Hangi dosyaları alırım?",
        "Planına ve seçimine göre EPUB, PDF, HTML, Markdown ve uygun koşullarda ek e-kitap formatları alırsın.",
      ],
      [
        "İlk önerilen çıktı hangisi?",
        "Önce EPUB alman önerilir. Yapıyı kontrol ettikten sonra PDF ve diğer formatlara geçebilirsin.",
      ],
      [
        "Çıktılar nerede tutuluyor?",
        "Her kitap kendi klasöründe, zaman damgalı çıktı klasörleri ile saklanır.",
      ],
      [
        "EPUB dosyasını direkt Amazon KDP'ye yükleyebilir miyim?",
        "Evet. Üretilen EPUB Amazon KDP'nin standart yükleme akışıyla uyumludur. Kapak ve metadata dahil olmak üzere bu süreçle 2 kitap KDP'de yayınlandı. Yayın öncesi kontrol listesi için blog bölümündeki KDP rehberine bakabilirsin.",
      ],
    ],
  },
  {
    title: "Haklar ve Yayın",
    items: [
      [
        "İçerik bana mı ait?",
        "Konu, yön, düzenleme ve son onay sende olduğu için ortaya çıkan kitabın kontrolü kullanıcıdadır.",
      ],
      [
        "KDP veya başka platformlarda yayınlayabilir miyim?",
        "Evet. Ürün dijital çıktı üretir; yayın kararı ve platform kurallarına uygunluk kontrolü kullanıcı sorumluluğundadır.",
      ],
      [
        "ISBN sağlar mısınız?",
        "Hayır. Metadata yönetimi vardır ama ISBN temini kullanıcı veya yayınevi tarafında çözülmelidir.",
      ],
    ],
  },
  {
    title: "Abonelik ve Ödeme",
    items: [
      [
        "Planımı değiştirebilir miyim?",
        "Evet. Faturalama alanından paket yükseltme, düşürme veya iptal akışı yönetilebilir.",
      ],
      [
        "Kullanılmayan haklar devreder mi?",
        "Hayır. Aylık haklar sonraki döneme taşınmaz.",
      ],
      [
        "Yanlış plan aldıysam ne olur?",
        "Değişiklik veya iade talebini destek üzerinden ilet; en kısa sürede değerlendirip dönüş yapıyoruz.",
      ],
      [
        "$4 tek seferlik ödeme ne kapsıyor?",
        "$4 Tek Kitap, aylık abonelik olmadan tek bir kitap için tam erişim sunar: tüm bölümler, kapak, EPUB ve PDF çıktısı. Süre sınırı yok. Birden fazla kitap üretmek isteyenler aylık planları tercih edebilir, ama ilk kitabı denemek için en düşük giriş noktası budur.",
      ],
    ],
  },
  {
    title: "Destek",
    items: [
      [
        "Destek nasıl alırım?",
        "İletişim sayfasındaki destek kanalları üzerinden teknik, teslim veya faturalama desteği alabilirsin.",
      ],
      [
        "Ne kadar sürede dönüş alırım?",
        "Standart hedef ilk iş günü içinde yanıt vermektir. Kritik ödeme sorunları daha hızlı ele alınır.",
      ],
      [
        "Sonuç beklediğim gibi değilse ne yapmalıyım?",
        "Önce konu özetini ve taslağı gözden geçir. Gerekirse yeniden yazım, genişletme veya destek yönlendirmesiyle akışı düzelt.",
      ],
    ],
  },
] as const;

export const supportChannels = [
  {
    title: "Genel destek",
    text: "Kullanım soruları, hesap erişimi ve teslim akışı için ana destek kanalı.",
    value: "support@bookgenerator.local",
  },
  {
    title: "Faturalama",
    text: "Plan, iptal ve ödeme sorunları için faturalama odaklı destek yolu.",
    value: "billing@bookgenerator.local",
  },
  {
    title: "Yanıt hedefi",
    text: "Standart taleplerde ilk iş günü içinde, kritik ödeme sorunlarında daha hızlı.",
    value: "1 iş günü",
  },
] as const;

export const blogPosts = [
  {
    slug: "how-to-validate-a-nonfiction-book-idea",
    title: "How to Validate a Nonfiction Book Idea",
    summary: "Bir nonfiction kitap fikrinin yayınlanmaya ve ürüne dönüşmeye değer olup olmadığını hızlıca test etmenin çerçevesi.",
    category: "Araştırma",
    readTime: "6 dk",
    datePublished: "2026-04-02",
    dateModified: "2026-04-02",
    intro: "Bir kitap fikri iyi duyulabilir ama hâlâ zayıf olabilir. Özellikle nonfiction tarafta asıl soru şu değildir: konu ilginç mi? Asıl soru şudur: bu konu belirli bir okur için net bir sonuç vaat ediyor mu, yeterince dar mı, ticari veya otorite değeri üretiyor mu ve 6-10 bölümlük sağlam bir omurga taşıyabiliyor mu? Bu yazı, fiction sezgileriyle değil; authority book, lead magnet ve KDP nonfiction açısından kitap fikri doğrulamanın pratik yolunu anlatır.",
    sections: [
      ["Önce konu değil okur netleşir", "Bir nonfiction fikirde ilk kontrol konu başlığı değildir; okur tanımıdır. 'Pazarlama kitabı' zayıf, 'B2B SaaS kurucuları için ilk 10 müşteri kazanma sistemi' güçlüdür. Çünkü ikinci ifade doğrudan kimin için yazıldığını ve hangi bağlamda fayda üreteceğini söyler. Eğer okur tek cümlede tarif edilemiyorsa, başlık da, vaat de, bölüm yapısı da bulanıklaşır. İyi fikir doğrulama her zaman okur açıklığıyla başlar."],
      ["Sonuç cümlesi yoksa fikir eksiktir", "Okur kitap bittikten sonra ne yapabilecek? Daha hızlı mı karar verecek, müşteri mi kazanacak, daha temiz bir sistem mi kuracak, bir yayına mı çıkacak? Sonuç cümlesi yoksa kitap yalnız bilgi yığınına dönüşür. Güçlü nonfiction fikirleri yalnız konu anlatmaz; okuru bir durumdan başka bir duruma taşır. Bir cümlede dönüşümü söyleyemiyorsan, fikir henüz hamdır."],
      ["Kapsam dar değilse güven de zayıflar", "Yeni başlayanların en sık hatası fazla geniş konuyla başlamaktır. 'Liderlik', 'kişisel gelişim', 'dijital pazarlama' gibi alanlar kitap fikri değil kategori adıdır. Kategoriyi fikre dönüştüren şey daraltmadır: segment, problem, yöntem, zaman ufku veya kullanım durumu. Dar kapsam kitabı küçültmez; tamamlanabilir, okunabilir ve savunulabilir hale getirir."],
      ["Derinlik sinyalini materyal verir", "Elinde notlar, workshop içeriği, müşteri soruları, blog yazıları veya kendi framework'ün varsa fikir daha güçlüdür. Çünkü nonfiction kitapları çoğu zaman uzmanlığın paketlenmiş halidir. Hiç materyal yoksa bu fikrin kötü olduğu anlamına gelmez; ama kitap yerine önce kısa rehber veya lead magnet daha doğru olabilir. Derinlik, yalnız konu seçiminden değil içerik stoku varlığından gelir."],
      ["Fikir yalnız okunur değil, işe yarar olmalı", "Authority book, lead magnet veya paid guide fark etmeksizin iyi nonfiction fikirleri kitap dışı değer de üretir. Bir satış görüşmesini kolaylaştırır, uzman imajını güçlendirir, e-posta toplar veya KDP fırsatı yaratır. Hiçbir işlev üretmeyen fikirler yalnızca yazma motivasyonu taşır; ama sürdürülebilir publishing sistemi için fonksiyon da gerekir."],
      ["En iyi test: mini outline çıkarabiliyor musun?", "Bir fikri doğrulamanın en hızlı yolu onun için 6-8 maddelik mini outline yazmaktır. Eğer giriş, temel problem, ana framework, hatalar, uygulama planı ve örnek vaka gibi bölümler doğal biçimde çıkıyorsa fikir omurga taşıyor demektir. Outline zorla çıkıyorsa sorun çoğu zaman içerikte değil positioning'dedir. Önce açıyı düzelt, sonra outline'a dön."],
    ],
  },
  {
    slug: "authority-book-mu-lead-magnet-book-mu",
    title: "Authority Book mu Lead Magnet Book mu?",
    summary: "Aynı konunun hangi durumda authority book, hangi durumda lead magnet olarak daha iyi çalışacağını netleştirir.",
    category: "Başlangıç",
    readTime: "6 dk",
    datePublished: "2026-04-02",
    dateModified: "2026-04-02",
    intro: "Birçok uzman aynı soruda takılır: elimdeki konu kitap olarak mı gitmeli, yoksa kısa ama yüksek dönüşümlü bir lead magnet olarak mı? Sorun genellikle içerik eksikliği değildir; format kararıdır. Authority book güven inşa eder, lead magnet talep toplar. Aynı ham malzeme iki farklı yapıya dönüşebilir. Bu yazı, hangi durumda hangisinin daha doğru olduğunu ayırır.",
    sections: [
      ["Authority book ne zaman doğru seçimdir?", "Amacın güven, uzmanlık algısı ve premium konumlanmaysa authority book daha doğru seçimdir. Bu format daha geniş bağlam kurar, seni yalnız bir taktik sağlayıcı değil düşünce sahibi olarak gösterir. Konuşma, danışmanlık, workshop veya daha yüksek fiyatlı tekliflerin varsa authority book uzun vadeli varlık gibi çalışır."],
      ["Lead magnet book ne zaman daha iyi çalışır?", "Daha hızlı e-posta toplamak, tek problemi net çözmek ve kullanıcıyı belirli bir sonraki adıma taşımak istiyorsan lead magnet formatı daha iyidir. Bu yapıda kapsam dar tutulur, bölüm sayısı sınırlanır ve CTA görünür kalır. Amaç tam kitap hissi vermek değil; hızlı kazanım karşılığında talep toplamaktır."],
      ["Aynı konu iki farklı yapıya nasıl döner?", "Örneğin 'koçlar için müşteri kazanma sistemi' konusu authority book olduğunda positioning, güven ve sistem mantığını uzun işler. Lead magnet olduğunda ise tek bir alt probleme iner: ilk discovery call sistemini kurmak gibi. Fark konu değil, kapsam ve CTA mimarisidir. Bu yüzden format kararı çoğu zaman başlıktan değil işletme hedefinden çıkar."],
      ["Karar kriteri: derinlik mi hız mı?", "Authority book daha fazla editoryal ağırlık ister ama daha kalıcı etki yaratır. Lead magnet daha hızlı üretilir ve daha net ölçülür. Eğer elinde derin bir framework ve birden çok alt başlık varsa authority book mantıklıdır. Eğer hızlı test etmek istediğin tek bir problem varsa lead magnet daha verimlidir."],
      ["Yanlış format seçiminin işareti nedir?", "Authority book yazarken sürekli CTA sıkıştırma ihtiyacı hissediyorsan muhtemelen lead magnet yazman gerekiyordur. Lead magnet hazırlarken sürekli yeni bölüm ekleyip kapsam büyütüyorsan muhtemelen authority book potansiyeli taşıyordur. Zorlama hissi, çoğu zaman format uyumsuzluğunun ilk işaretidir."],
      ["Pratik karar kuralı", "Okur kitabı bitirdiğinde seni daha ciddi görmek mi istiyorsun, yoksa sana iletişim bilgisi bırakmasını mı? İlk durumda authority book, ikinci durumda lead magnet ağır basar. Emin değilsen mini outline çıkar ve CTA’yı sona koy. Outline sürekli genişliyorsa authority tarafına, tek sonuca sıkışıyorsa lead magnet tarafına gidiyorsun demektir."],
    ],
  },
  {
    slug: "zayif-bir-kitap-fikri-nasil-guclendirilir",
    title: "Zayıf Bir Kitap Fikri Nasıl Güçlendirilir?",
    summary: "Geniş, jenerik veya sonuçsuz görünen bir kitap fikrini daha net, daha okunur ve daha satılabilir hale getirme yöntemi.",
    category: "Araştırma",
    readTime: "6 dk",
    datePublished: "2026-04-02",
    dateModified: "2026-04-02",
    intro: "Kötü fikirlerin çoğu gerçekten kötü değildir; yalnızca çok geniş, çok genel veya çok belirsizdir. 'Verimlilik', 'liderlik', 'markalaşma' gibi başlıklar kulağa güçlü gelir ama kitap seviyesi için yeterli yön vermez. Güçlü nonfiction fikirleri sıfırdan bulunmaz; çoğu zaman zayıf görünen çekirdeğin doğru şekilde daraltılmasıyla kurulur. Bu yazı, fikir güçlendirme sürecini adım adım anlatır.",
    sections: [
      ["Önce geniş etiketi parçala", "Bir fikri güçlendirmenin ilk adımı kategori etiketini problem diline çevirmektir. 'Liderlik' yerine hangi liderlik problemi? 'Pazarlama' yerine hangi kanal, hangi segment, hangi sonuç? Kategori seviyesi kelimeler kitap değil klasör adıdır. Güçlü kitap fikri için klasörden dosyaya inmek gerekir."],
      ["Segment ekle, fikir netleşsin", "Zayıf fikirlerin çoğu herkese konuşmaya çalışır. Oysa tek bir segment eklemek bile başlığı ve içeriği keskinleştirir. 'Kişisel marka' yerine 'bağımsız danışmanlar için kişisel marka', 'üretkenlik' yerine 'uzaktan çalışan ekip liderleri için toplantısız üretkenlik' gibi. Segment, yalnız kitleyi değil örnek setini ve tonu da netleştirir."],
      ["Soyut konuyu sonuç cümlesine bağla", "Bir fikir eğer yalnız konuysa zayıftır; konu artı sonuç olduğunda güçlenir. 'İçerik pazarlaması' yerine '3 ay içinde satış görüşmesi çıkaran içerik sistemi', 'eğitim tasarımı' yerine 'workshop'tan ücretli programa geçen eğitim akışı'. Sonuç, okurun neden ilgilenmesi gerektiğini açık eder."],
      ["Yöntem veya çerçeve kat", "Benzer kitaplar arasında ayrışmanın en hızlı yolu kendi yöntemin, sıralaman veya karar mantığını eklemektir. Herkes 'nasıl yapılır' diyebilir; ama herkes kendi filtrelerini, teşhis sorularını veya uygulama sırasını sunamaz. Fikirin içine yöntem girdiğinde başlık jenerikten çıkıp savunulabilir hale gelir."],
      ["Düşük derinlikteyse formatı küçült", "Bazen fikir iyi ama henüz kitap derinliğinde değildir. Böyle durumlarda çözüm fikri atmak değil, formatı küçültmektir. Önce lead magnet, short guide veya workshop companion olarak başlamak daha doğru olabilir. Küçük format, fikirin pazarda çalışıp çalışmadığını test eder ve ileride daha büyük authority book'a dönüşebilir."],
      ["Son kontrol: bir cümlede savunabiliyor musun?", "Güçlendirilmiş fikir tek cümlede savunulabilir olmalıdır: bu kitap kimin için, hangi problemi çözüyor ve sonunda ne kazandırıyor? Eğer bunu durmadan açıklamak zorunda kalıyorsan fikir hâlâ bulanıktır. Net cümle, net outline üretir; net outline da hızlı kitap üretimini mümkün kılar."],
    ],
  },
  {
    slug: "ai-ile-yazilan-kitap-kime-aittir",
    title: "AI ile Yazılan Kitap Kime Aittir?",
    summary: "İçerik kontrolü, hak sahipliği ve kullanıcı sorumluluğunu sade biçimde açıklar.",
    category: "Haklar",
    readTime: "7 dk",
    datePublished: "2024-10-15",
    dateModified: "2025-02-01",
    intro: "AI ile kitap yazma araçları yaygınlaştıkça en çok sorulan soru hep aynı: Bu kitabın gerçekten sahibi ben miyim? Konu, yön ve son karar sende olduğu sürece cevap büyük ölçüde açık — ama hukuki ve pratik boyutları anlamak, yayın kararı öncesinde gerçek bir güven zemini oluşturur. Dünyada henüz AI üretimi içeriğe yönelik tam oturmuş bir hukuki çerçeve yok; ülkeden ülkeye, platformdan platforma farklılıklar var. Bu yazı bir avukatlık hizmeti değil — kitabını yayınlamadan önce bilmen gereken temel çerçeveyi ve pratik adımları sade biçimde özetliyor. Hangi kararları sen aldıysan, eserin o ölçüde sana ait olduğunu anlaman için birkaç dakikan yeterli.",
    sections: [
      ["Telif hakkı nasıl oluşur?", "Geleneksel telif hukuku, bir eseri yaratan insan zihniyle başlar. Yaratıcılık, özgünlük ve ifade özgürlüğü bir arada olduğunda hak doğar. Yapay zeka modeli bugün itibarıyla çoğu ülkede — ABD, AB ve Türkiye dahil — hukuki özne olarak tanınmıyor. Dolayısıyla modelin kendisi adına bir telif iddiası oluşmuyor. Asıl soru şu: AI aracını kullanan kişi ne kadar yaratıcı katkıda bulundu? Konuyu sen belirlediysen, hedef kitleyi sen tanımladıysan, bölüm yapısını sen onayladıysan, metni okuyup düzenlediysen ve kişisel örnekler ya da bakış açıları kattıysan — ortaya çıkan eserde senin zihinsel emeğin belirleyici rol oynadı. Bu durum, ghostwriter çalıştıran bir yazardan özünde farklı değil: içeriği o üretir, ama konuyu, tonu ve yönü kitabın sahibi belirler. Hak iddiasının güçlü kalması için süreçte aktif ve belgelenebilir bir rol oynaman yeterlidir. Pasif kalan, brief vermeden rastgele içerik alıp doğrudan yayınlayan kullanıcılar daha zayıf bir konumda durabilir — ama bilinçli, adım adım ilerleyen kullanıcılar için tablo çok daha nettir."],
      ["AI aracı kullanmak neyi değiştiriyor?", "AI aracı kullanmak, ürünün sana ait olup olmadığını değil, nasıl üretildiğini etkiliyor. Bir kelime işlemci kullanan yazar nasıl ki yazısının tartışmasız sahibiyse, AI asistanla outline kurup bölümler üretip düzenleyen kullanıcı da kitabının kontrolünü elinde tutmaktadır. Fotoğrafçı kamerayı icat etmedi, ama çektiği fotoğraf ona aittir — çünkü kadrajı, ışığı, anı ve niyeti o belirledi. Kitap yazarlığında da benzer mantık işler. Önemli olan araç değil, karar zinciridir: hangi konuyu seçtin, hangi bölüm başlıklarını kabul ettin, hangilerini değiştirdin ya da sildin, metne hangi örnekleri ve kişisel deneyimleri ekledin? Book Generator bu süreçte her aşamada seni merkeze alıyor — sistem bir taslak sunar, ama her kararı onaylayan ve şekillendiren sensin. Düzenleme yaptığın, bölümleri yeniden yazdığın veya kişisel perspektif kattığın her an, o içerik üzerindeki yaratıcı emeğini somutlaştırıyor. Bu yapı, üretim sürecindeki aktif rolünü hem pratikte hem de hukuki açıdan belgeler nitelikte."],
      ["KDP ve yayın platformları ne soruyor?", "Amazon KDP dahil büyük dijital yayın platformları, yüklenen içeriğin haklarına sahip olduğunuzu açıkça beyan etmenizi istiyor. Bu beyan, telif ihlali veya kopya içerik yüklenmemesi amacıyla gerekli. Platformlar AI üretimi içeriği bugün itibarıyla doğrudan yasaklamıyor — ancak içeriğin özgün, başka kaynaktan kopyalanmamış ve yanıltıcı olmayan nitelikte olmasını şart koşuyor. AI ile üretilen içerik, modelin eğitim verisinden birebir kopyalanmadığı sürece bu özgünlük testini genellikle geçiyor. Bununla birlikte bazı platformlar, AI yardımıyla üretildiğini öne çıkaran içeriklerde beyan zorunluluğu getirmeye başladı. Amazon'un yayıncı rehberi de bu alanda güncelleniyor. Pratik öneri şudur: yükleme öncesinde güncel platform politikasını kontrol et, özellikle AI üretimine ilişkin beyan veya açıklama zorunluluğu var mı bak. Bu küçük adım, ileride platformla sorun yaşama ihtimalini sıfıra yakın tutar."],
      ["Pratik kontrolü elinizde tutmanın yolları", "Hak sahipliğini pratikte güçlü tutmak için birkaç somut adım işe yarıyor ve bunların hiçbiri zaman alıcı değil. İlk adım: brief ve outline'ı kendiniz yazın ya da aktif biçimde düzenleyin. Sistemin önerdiği bölüm başlıklarını körü körüne onaylamak yerine en az birkaç tanesini değiştirmek, karar izini belgeler. İkinci adım: üretilen her bölümü okuyun ve en az birkaç cümleyi kendiniz yeniden yazın ya da kişisel bir örnek ekleyin. Üçüncü adım: kitabın konusu kendi uzmanlığınızdan, deneyiminizden veya araştırmanızdan beslensin — tamamen jenerik bir konuya tamamen jenerik bir taslak üretmek en zayıf konumdur. Dördüncü adım: final dosyayı kendi hesabınızdan export edin ve kendi yayıncı hesabınızdan yayınlayın. Bu dört adım bir arada, yayınlanan kitabın kime ait olduğu sorusunu pratikte tartışmasız hale getirir. Ayrıca kitabı yayınladıktan sonra üretim sürecine ait notları, düzenleme kayıtlarını veya brief geçmişini saklamak, olası bir uyuşmazlıkta destekleyici belge işlevi görür."],
      ["Sık sorulan endişelere dürüst yanıtlar", "En sık duyulan endişe şu: ya AI şirketi üretilen içerikleri kendi amaçları için kullanırsa? Bu, hizmet sözleşmesinin şeffaflığıyla ilgili meşru ve yerinde bir soru. Book Generator'ın politikası açıktır: üretilen içerik kullanıcıya aittir ve platform, kullanıcı içeriğini üçüncü taraflarla paylaşmaz ya da model eğitiminde kullanmaz. Herhangi bir aracı tercih etmeden önce gizlilik politikasını ve kullanım şartlarını okumak her zaman akıllıca davranıştır. İkinci sık endişe: iki kullanıcı benzer brief girerse benzer içerik çıkar mı? Genel konularda yapısal benzerlik oluşabilir — tıpkı iki farklı yazarın 'freelance çalışmaya başlangıç rehberi' yazması gibi. Ama özgün ses, kişisel örnekler, hedef kitleye özel ton ve düzenleme katmanı bu yapısal benzerliği anlamlı biçimde ortadan kaldırır. Çıktı üzerinde ne kadar kişisel iz bırakırsanız, kitap o kadar ayırt edici ve size ait olur. Üçüncü endişe: AI üretimi içerik belli olur mu, okur fark eder mi? Kişisel örnekler, somut bağlam ve düzenleme katmanı eklendiğinde bu sorun büyük ölçüde çözülür."],
      ["Sonuç: kimin kitabı?", "Eğer konuyu sen seçtiysen, okuru sen tanımladıysan, taslağı sen onayladıysan, bölümleri okuyup şekillendirdiysen ve son kararı sen verdiysen — bu senin kitabın. AI bir hız ve yapı aracıdır; kitabın mimarı, editörü ve yayıncısı sensin. Aracı kullanmak sahipliği ortadan kaldırmaz — tıpkı bir fotoğrafçının kamera kullanmasının, bir mimarın tasarım yazılımı kullanmasının ya da bir gazetecinin ses kayıt cihazına başvurmasının çalışmayı onlara ait olmaktan çıkarmaması gibi. Önemli olan araç değil, arkasındaki insan zihni ve karar sürecidir. Kitabına girdiğin emek, attığın her düzenleme adımı ve sunduğun her özgün bakış açısı — bunların tamamı seni o kitabın gerçek sahibi kılar."],
    ],
  },
  {
    slug: "ilk-kitabimi-nasil-planlarim",
    title: "İlk Kitabımı Nasıl Planlarım?",
    summary: "İlk kez kitap üreten biri için en kısa planlama mantığını verir.",
    category: "Başlangıç",
    readTime: "7 dk",
    datePublished: "2024-11-01",
    dateModified: "2025-02-10",
    intro: "İlk kitapta sorun çoğu zaman yazmak değil, dağınık başlamaktır. Konu geniş, bölümler belirsiz, nereden başlayacağın belli değil. Birçok kişi aylarca 'planlıyorum' diyerek aynı noktada döner — çünkü asıl sorun bilgi eksikliği değil, yapı eksikliğidir. Oysa iyi bir plan, kitabın yarısından fazlasıdır. Ne yazacağını bilen biri neredeyse her zaman bitirir; ne yazacağını bilmeyen ise çoğunlukla yarım bırakır. Bu yazı seni uzun metodolojilere, ağır yazarlık kitaplarına ya da aylık planlama süreçlerine değil — ilk kitabını fiilen tamamlamak için gerçekten işe yarayan, kısa ve uygulanabilir bir planlama mantığına götürüyor. Birkaç net karar, onlarca belirsiz fikrden çok daha fazla değer taşır.",
    sections: [
      ["Neden plan kitabı kurtarır?", "Plansız başlayan kitaplar genellikle yarım kalır — çünkü yazamamak değil, ne yazacağını bilmemek yorar insanı. İlk birkaç sayfa kolayca akar, sonra hangi bölüme ne yazacağın belirsizleşir, konu dağılır ve motivasyon düşer. Plan sana üç temel soruya net cevap verir: Hangi soruyu cevaplıyorsun? Kim için yazıyorsun? Kitap bittiğinde okur hayatında ne değişmiş olacak? Bu üç soruya dürüstçe cevap verebiliyorsan, geri kalan içerik bu çerçeveye oturur. Plan uzun ve ayrıntılı olmak zorunda değil — bir A4 kağıda sığacak kadar net olması yeterli. Profesyonel yazarlar bile 300 sayfalık bir kitabı genellikle tek sayfalık bir özetten başlatır. Sen de aynısını yapabilirsin: bir cümle konu, bir cümle hedef okur, bir cümle kitabın vaadi. Buradan başlamak, sonsuz taslak döngüsünün önüne geçer."],
      ["Tek sonuç seç", "İyi bir kitap, okura tek bir anlamlı dönüşüm sunar. Kitabı bitiren biri ne yapabilecek, ne bilecek ya da nasıl hissedecek? Bu soruya tek ve net bir cümleyle cevap verebiliyorsan kitabının odağı var demektir. Örneğin: 'Bu kitabı okuyan biri, freelance müşteri bulmak için sosyal medyayı nasıl kullanacağını adım adım öğrenecek.' Bu netlik, bölüm yapısını, örnek seçimini ve tonu doğrudan belirler. Her şeyi aynı anda anlatmaya çalışan kitaplar ne yazık ki hiçbir şeyi tam anlatamaz — çünkü her konu biraz yer kaplar, ama hiçbiri yeterince derin işlenmez. İlk kitabını yazıyorsan kapsamı dar tut; bu zayıflık değil, disiplindir. Freelance çalışmayı, girişimciliği ve dijital pazarlamayı aynı kitapta anlatmaya çalışmak yerine, sadece bir konuya odaklan. Daraltmak kaybettirmez — tam tersine, kitabı bitirebilir kılar ve okuyucuyla daha güçlü bağ kurmanı sağlar."],
      ["Tek okur tipi belirle", "Kime yazıyorsun? Bu sorunun cevabı ne kadar spesifik olursa kitap o kadar güçlü olur. 'Herkes için' yazılan kitaplar pratikte kimseye tam hitap etmez; her okura biraz değinen içerik, hiç kimseye gerçekten konuşmaz. Hedef okurunu somut bir insan gibi düşün: kaç yaşında, hangi sektörde çalışıyor, ne biliyor, ne bilmiyor, hangi sorunu çözmeye çalışıyor ve şu an hangi kaynakları kullanıyor? Örneğin 'çalışan ebeveynler' yerine 'ilk çocuğunu bekleyen, uzaktan çalışan ve verimlilik sorunuyla boğuşan biri' çok daha güçlü bir hedef okur tanımıdır. Ne kadar net tanımlarsan ton, kelime seçimi, örnek seçimi ve hatta bölüm sıralaması o kadar isabetli olur. Belirsiz kitle için yazılan kitaplar hızla genelleşir, jargon yüklü ya da anlamsız derecede sade bir dil seçilir, somut örnekler bulmak zorlaşır. Tek bir okur tipine yazmak seni kısıtlamaz — aksine seni özgür kılar."],
      ["Küçük omurga kur", "İlk sürüm için 5 ile 7 ana bölüm, çoğu rehber veya uzman kitabı için yeterlidir. Her bölüm, ayrı bir soruyu cevaplamalı ve bir öncekinin bilgisi üzerine inşa etmeli. Bölüm başlıklarını bu aşamada mükemmel yazmana gerek yok — sadece akışın mantıklı olup olmadığını kontrol et. Kendin için basit bir test: Bölüm 1'i okumadan Bölüm 3 anlaşılır mı? Eğer evet ise, bu bölümler arasında gerçek bir bağ yok demektir. Omurga oturduğunda, içerik üretmek çok daha kolay ve hızlı hale gelir. Çünkü her bölümde ne anlatacağını önceden biliyorsun — konu seçme, yapı kurma ve içerik üretme aşamaları birbirine karışmıyor. Book Generator wizard'ı bu süreci otomatik olarak başlatır: konu ve hedef okur bilgisine göre sistem bir outline önerir, sen de bunu düzenleyip onaylarsın. Boş sayfayla başlamak yerine hazır bir iskeletle başlamak, tempoyu en başından korur."],
      ["Gerçekçi kapsam belirle", "İlk kitabında her şeyi anlatmak zorunda değilsin — aksine bunu yapmaya çalışmak kitabı bitirememenin en yaygın nedenlerinden biridir. Az ama derinlemesine anlatmak, çok ama yüzeysel anlatmaktan çok daha değerlidir hem okur hem de yazar açısından. 60 sayfalık yoğun ve somut bir rehber, 200 sayfalık tekrarcı ve gevşek bir kitaptan çok daha güçlü etki bırakır ve çok daha hızlı tamamlanır. Kapsamı belirlerken kendin için şu eleme sorusunu kullan: 'Bu bölümü çıkarırsam, hedef okuruma gerçekten ne kaybettirmiş olurum?' Eğer cevap net değilse, muhtemelen o bölüm zorunlu değildir. Sadece vazgeçilmez içeriği yaz; geri kalanını bir sonraki kitaba, bir bloga ya da bir kursa bırak. Kapsam kararı bir kez alındığında, üretim çok daha akıcı ilerler."],
      ["Araç bu süreci nasıl hızlandırıyor?", "Book Generator'ın wizard akışı tam da bu planlama aşamasını hızlandırmak için tasarlandı. Konu, hedef okur, ton ve dil bilgilerini birkaç kısa soruda girdikten sonra sistem sana somut bir outline önerir — bölüm başlıkları, sıralama ve genel yapıyla birlikte. Bu öneriyi beğenip doğrudan onaylayabilir, başlıkları tek tek düzenleyebilir ya da tamamen sıfırdan yazabilirsin. En büyük avantaj şudur: boş sayfayla başlamak yerine üzerinde çalışabileceğin bir yapıyla başlıyorsun. İlk kitabında en büyük engel çoğunlukla bilgi eksikliği değil, 'nereden başlayayım' sorusuna cevap bulamamaktır. Wizard bu soruyu sana sormaktan çıkarır ve seni hemen içerik kararı aşamasına geçirir. Deneyimli yazarlar bile benzer taslak süreçlerini kullanır — fark, aracın bu süreyi saniyeye indirmesidir."],
    ],
  },
  {
    slug: "epub-ve-pdf-farki",
    title: "EPUB ve PDF Farkı Nedir?",
    summary: "İlk kullanıcı için hangi formatın ne zaman doğru olduğunu açıklar.",
    category: "Yayın",
    readTime: "6 dk",
    datePublished: "2024-11-15",
    dateModified: "2025-02-15",
    intro: "Kitabını bitirdin, export zamanı geldi — ama hangi format? EPUB mi, PDF mi, ikisi birden mi? Bu soru görünürde basit, ama yanlış format seçmek gereksiz teknik sorunlara, platform red bildirimlerine veya okuyucu deneyimini bozan görüntü bozukluklarına yol açabilir. Çoğu kullanıcı her iki formatı da almak istiyor, haklı olarak — ama hangisinden başlaması gerektiğini ve ikisi arasındaki farkın tam olarak ne anlama geldiğini bilmiyor. Bu yazı uzun teknik açıklamalar yerine doğrudan sonuca götürüyor: doğru formatı, doğru amaç için, doğru zamanda seç.",
    sections: [
      ["EPUB nedir, nasıl çalışır?", "EPUB, elektronik yayıncılık için geliştirilmiş açık bir standarttır ve adı 'electronic publication' kelimelerinden gelir. En temel özelliği akışkan yapısıdır: metin, okuyucunun ekran boyutuna, çözünürlüğüne ve font tercihine göre otomatik olarak yeniden şekillenir. Telefonda okurken satırlar daralır ve uyum sağlar, tablette genişler, e-kitap okuyucuda kullanıcı font boyutunu büyütüp küçültebilir — içerik her koşulda okunabilir kalır. Bu esneklik, EPUB'u dijital dağıtım için standart haline getirir. Amazon Kindle, Apple Books, Kobo, Google Play Books ve neredeyse tüm büyük e-kitap platformları EPUB 3 formatını destekler. Amazon, eskiden .mobi formatını öneriyordu; ancak 2022'den itibaren EPUB'u birincil format olarak benimsedi. Kısacası dijital olarak dağıtmayı, KDP'ye yüklemeyi veya okuyucuya doğrudan göndermeyi planlıyorsan EPUB senin birincil çıktın olmalı."],
      ["PDF nedir, ne zaman tercih edilir?", "PDF, 'Portable Document Format' kelimelerinin kısaltmasıdır ve Adobe tarafından 1990'ların başında geliştirilmiştir. Temel özelliği sabit düzendir: sayfalar tam olarak tasarlandığı gibi görünür — font boyutu, satır aralığı, görsellerin yeri, sayfa boşlukları hiçbir zaman değişmez. Hangi cihazda, hangi yazılımda açılırsa açılsın görünüm aynıdır. Bu özellik baskı için idealdir: matbaaya gönderilecek dosyalar, fiziksel kitap üretimi, tam sayfa tasarımlı kılavuzlar veya sertifikalar PDF gerektirir. Amazon KDP'de paperback veya hardcover kitap yayınlamak istiyorsan iç metin ve kapak ayrı PDF dosyaları olarak hazırlanmalıdır. Öte yandan dijital okuma için PDF birçok açıdan zahmetlidir: telefon ekranında okunması yorucu, satırları sığdırmak için sürekli yakınlaştırıp uzaklaştırmak gerekir, font boyutu kullanıcı tarafından ayarlanamaz. Bu yüzden e-kitap platformlarına yükleme için PDF yerine EPUB tercih edilir."],
      ["KDP hangi formatı istiyor?", "Amazon KDP iki farklı yayın türü için iki farklı format bekler. Dijital kitap (Kindle eBook) yayınlamak için EPUB 3 formatı gereklidir ve KDP bu formatı doğrudan kabul eder. 2022 öncesinde .mobi formatı da yaygın olarak kullanılıyordu, ancak Amazon artık EPUB'u resmi olarak öneriyor ve yeni yüklemelerde EPUB tercih ediliyor. KDP'nin kendi önizleme aracı Kindle Previewer, EPUB dosyanı yükleyip Kindle ekranında nasıl görüneceğini simüle etmenizi sağlar — yükleme öncesinde bu kontrolü yapmak iyi bir alışkanlıktır. Baskılı kitap (paperback veya hardcover) yayınlamak için ise PDF gereklidir. İç metin tek bir PDF, kapak ise ayrı bir PDF olarak hazırlanır. Kapak PDF'inin boyutu sayfa sayısına göre belirlenir çünkü sırt kalınlığı sayfa sayısına göre değişir. KDP bu hesaplamayı kolaylaştırmak için ücretsiz bir kapak şablonu aracı sunuyor. Özetle: dijital için EPUB, baskı için PDF — ikisini de yapmayı düşünüyorsan her iki formatı da hazır bulundurman gerekir."],
      ["Önce hangisini almalısın?", "Pratik öneri nettir: önce EPUB al, PDF'i sonraya bırak. EPUB aldığında kitabın yapısını, bölüm sıralamasını, başlık hiyerarşisini ve genel akışını bir e-kitap okuyucuda, Kindle Previewer'da veya tarayıcı tabanlı araçlarla kolayca kontrol edebilirsin. Hangi bölüm başlığı yanlış hiyerarşide görünüyor, içindekiler tablosu doğru linkleri mi gösteriyor, akış mantıklı mı — bunları EPUB'da görmek çok daha kolaydır. Yapısal sorunları burada yakalayıp düzelttikten sonra PDF almak hem zaman kazandırır hem de PDF'te gereksiz düzeltme döngüsünün önüne geçer. Sadece dijital dağıtım yapacaksan PDF'e hiç gerek olmayabilir. Baskı düşünüyorsan sıraya göre: önce EPUB ile içerik ve yapıyı doğrula, ardından PDF ile baskı düzenini kontrol et. İkisini aynı anda almak da mümkün; ancak kontrol mantığı açısından EPUB her zaman ilk adım olmalı."],
      ["Dönüşüm sürecinde dikkat edilmesi gerekenler", "EPUB üretirken en kritik nokta başlık hiyerarşisidir. H1 kitap başlığı, H2 bölüm başlıkları, H3 alt bölüm başlıkları olarak doğru işaretlenmezse içindekiler tablosu yanlış oluşur ve bazı okuyucu uygulamalarında gezinme bozulur. Görsellerin EPUB içine gömülü olup olmadığını kontrol et — bağlantılı görseller bazı platformlarda görünmeyebilir. Ayrıca EPUB dosyanı yayınlamadan önce epubcheck gibi bir doğrulama aracıyla test etmek, KDP'nin olası red bildirimlerinin önüne geçer. PDF üretirken ise kenar boşlukları, font gömme ve sayfa boyutu kritik öneme sahiptir. KDP baskılı kitaplar için genel trim size seçenekleri sunar; en yaygını 6x9 inçtir. Bleed alanı olan görseller için ek ayar gerekir. Book Generator bu teknik detayları büyük ölçüde sizin adınıza yönetir ve çıktıları platform uyumlu üretir; yine de son kontrol adımını atlamak iyi bir alışkanlık değil."],
      ["Özet: formatı amacına göre seç", "EPUB: dijital okuma, e-kitap platformları, Amazon Kindle, Apple Books, Kobo, mobil cihazlar. Kullanıcı font boyutunu ayarlayabilir, metin ekran boyutuna uyum sağlar, dosya boyutu küçüktür. PDF: baskı, sabit düzen, matbaa dosyası, KDP paperback iç metin ve kapak. Tasarım piksel mükemmelliğinde korunur, platform bağımsız görünür. Her iki format da farklı amaçlar için gerekli olabilir ve biri diğerinin yerine geçemez. Başlangıç noktası her zaman EPUB olsun: yapıyı orada doğrula, içeriği kontrol et, onayladıktan sonra PDF'e geç. Book Generator her iki formatı da export seçenekleri olarak sunar; ikisini aynı anda almak için ekstra çaba gerekmez."],
    ],
  },
  {
    slug: "kdpye-yuklemeden-once-ne-kontrol-etmeli",
    title: "KDP’ye Yüklemeden Önce Ne Kontrol Etmeli?",
    summary: "Yayın öncesi kısa ama pratik bir kontrol mantığı sunar.",
    category: "KDP",
    readTime: "7 dk",
    datePublished: "2024-12-01",
    dateModified: "2025-03-01",
    intro: "Kitabın hazır, yükleme zamanı geldi. Ama KDP yükleme ekranına geçmeden önce birkaç dakika harcayıp temel kontrolleri yapmak, ilerleyen günlerde düzeltme döngüsünden seni kurtarır. Reddedilen başvurular ve düşük dönüşüm oranları çoğunlukla önlenebilir hatalardan kaynaklanır — başlık yanlış kategoride, kapak boyutu hatalı, açıklama ilk cümlede okuru kaybediyor. Bu yazı uzun bir kontrol listesi değil; yükleme öncesi yapman gereken en kritik beş kontrolü, her birinin neden önemli olduğunu ve nasıl düzeltileceğini pratik örneklerle anlatıyor. Bu kontrolleri yapan yayıncılar, yayın sonrası 'neden satış yok?' sorusunu çok daha az soruyor.",
    sections: [
      ["Metadata net mi?", "KDP’de başlık, alt başlık ve kitap açıklaması en kritik alandır çünkü Amazon algoritması bu alanlardaki kelimelere bakarak kitabı sınıflandırıyor ve potansiyel okurlarına gösteriyor. Başlık kitabın ne hakkında olduğunu tek cümlede anlatmalı — belirsiz ya da sadece yaratıcı başlıklar arama trafiğini öldürür. Örneğin ‘Dijital Özgürlük’ yerine ‘Freelance Hayata Geçiş: 90 Günde Kurumsal İşten Bağımsız Kariyere’ çok daha güçlü bir başlıktır. Alt başlık varsa hedef kitleyi veya vaadi netleştirmeli; okura ‘bu kitap senin için mi?’ sorusunu yanıtlatmalı. Açıklamanın ilk iki cümlesi en kritik alan: birçok platformda açıklamanın tamamı görünmez, yalnızca ilk kırk-elli kelime ekranda yer alır. ‘Bu kitapta X öğreneceksin’ ile başlamak yerine okurda bir tanıma anı yaratan bir cümle dene: ‘Her sabah işe gitmeye zorlanıyorsan, bu kitap tam senin için.’ Kullandığın anahtar kelimelerin başlık ve açıklamada doğal biçimde geçmesi hem arama sıralamasına hem de okur güvenine katkı sağlar."],
      ["Kategori ve anahtar kelimeler seçildi mi?", "KDP iki kategori ve yedi anahtar kelime seçmenize izin veriyor — bu alanları boş bırakmak ya da rastgele doldurmak ciddi bir keşfedilirlik kaybıdır. Kategori seçimi hem organik arama görünürlüğünü hem de 'En Çok Satanlar' rozet olasılığını doğrudan etkiliyor. Ana kategoride yüzlerce kitabın arasında kaybolmak yerine, daha küçük ama ilgili bir alt kategoride yer almak çok daha değerlidir. Örneğin 'İş ve Kariyer' gibi geniş bir kategori yerine 'Serbest Çalışma ve Fiyatlandırma Stratejileri' gibi niş bir alt kategori, ilk aylarda rakiplerinden sıyrılmana yardımcı olur. Anahtar kelimeler için jargon değil, gerçek okur aramaları düşün: bir kişi Amazon arama kutusuna ne yazar? Bu soruyu yanıtlamak için Amazon'un otomatik tamamlama önerilerini kullan — ücretsiz ve doğrudan gerçek kullanıcı davranışından besleniyor. Bu alanda on dakika harcamak, kitabın aylarca organik erişim farkı yaratabilir."],
      ["İçerik akışı temiz mi?", "Yükleme öncesi içerik kontrolü kelime kelime düzeltme anlamına gelmiyor — asıl hedef yapısal sorunları yakalamak. Önce bölüm başlıklarına bak: sırayla okuyunca bir mantık akışı görüyor musun? Her bölüm bir öncekinin üzerine inşa ediyor mu, yoksa birbirinden bağımsız parçalar mı sıralanmış? Sonra her bölümün yalnızca ilk cümlesini oku: bölüm ne hakkında olduğunu ilk cümlede net söylüyor mu? Bu hızlı tarama, bağlamdan kopuk bölümleri ve gereksiz tekrarları çoğu zaman saniyeler içinde ortaya çıkarır. Özellikle AI taslağından üretilen içeriklerde aynı fikrin farklı bölümlerde farklı kelimelerle yinelendiği sık görülür. Bir de 'bunu çıkarırsam okur ne kaybeder?' testini uygula: eğer bir bölümü çıkardığında kitap daha akıcı okunuyorsa o bölüm muhtemelen gereksizdir. Temiz bir akış iade oranını düşürür ve olumlu yorum alma ihtimalini artırır."],
      ["Kapak KDP gereksinimlerini karşılıyor mu?", "KDP dijital kitap kapağı için minimum 1000 piksel genişlik, ideal 2560x1600 piksel çözünürlük ve 1.6:1 en boy oranı gerektiriyor. Bu şartları karşılamayan kapaklar ya yükleme sırasında reddediliyor ya da platformda bulanık ve pikselleşmiş görünüyor — her iki durum da profesyonellik algısını anında zedeliyor. Baskılı kitap için ön kapak, arka kapak ve sırt birleşik tek PDF olarak hazırlanmalı; sırt genişliği sayfa sayısına göre değişiyor ve KDP'nin şablon hesap aracını kullanmak zorunlu. Kapağı yüklemeden önce küçük thumbnail boyutuna indirip başlığın hâlâ okunabilir olup olmadığını test et. Kindle mağazasında kitaplar liste görünümünde küçücük bir kare olarak görünüyor; bu boyutta başlık seçilemeyen kapaklar tıklanma almıyor. Kapak türle de uyuşmalı: rehber ve iş kitabı görünümü — temiz zemin, tipografi ağırlıklı, minimal ikon — güven sinyali verirken kurgu kapağı gibi tasarlanmış bir non-fiction kapak okuru şaşırtır ve dönüşümü düşürür."],
      ["Dosya teknik olarak sorunsuz mu?", "EPUB dosyasını KDP’ye yüklemeden önce Kindle Previewer uygulamasıyla ya da tarayıcı tabanlı KDP önizleme aracıyla test etmek ciddi sorunları erkenden yakalamanı sağlar. Kontrol edilmesi gereken başlıca noktalar: İçindekiler tablosu doğru bölümlere link veriyor mu? Her bölüm başlığı gerçekten yeni bir sayfada başlıyor mu? Görseller varsa tüm cihazlarda düzgün görünüyor mu? Fontlar EPUB dosyasına gömülü mü? Bu son nokta özellikle önemli: gömülü olmayan fontlar farklı cihazlarda öngörülemeyen görünümler üretiyor ve okuma deneyimini bozuyor. Eğer baskılı kitap için PDF yüklüyorsan kenar boşluklarının, trim size ayarının ve bleed değerlerinin KDP şartname sayfasındaki ölçülerle uyuştuğundan emin ol. Book Generator çıktıları platform uyumlu üretir ama son doğrulamayı yapmak iyi pratik — bu beş dakikalık kontrol, ilerleyen dönemde saatlik düzeltme turlarının önüne geçer."],
      ["Yayın öncesi son tur", "Beş kontrol tamamlandıktan sonra bir adım daha: kitabı KDP'nin Kindle Previewer aracında baştan sona gözden geçir. Bu araç üç farklı cihaz görünümü sunuyor — telefon, tablet ve e-ink okuyucu. Kitabın üç görünümde de okunabilir ve tutarlı görünmesi yayın kalitesinin temel ölçütü. Sayfa geçişlerinde garip atlama oluyor mu? Bölüm başları her zaman yeni sayfada mı açılıyor? Özel karakterler ya da liste maddeleri doğru görünüyor mu? Bu turda gördüğün küçük sorunları düzeltmek için kitabı tekrar yüklemene gerek yok — dosyayı düzeltip yeni sürümü yükleyebilirsin, yayınlanmış kitabı da sonradan güncelleyebilirsin. Ama büyük yapısal sorunları yayın sonrası fark etmek hem erken alınan olumsuz yorumlar hem de ilk izlenim kaybı açısından maliyetlidir. Bu son tura on dakika ayır; mükemmel olmak zorunda değil, yayınlanmaya hazır olmak yeterli."],
    ],
  },
  {
    slug: "yazmayi-bilmeden-kitap-cikarabilir-miyim",
    title: "Yazmayı Bilmeden Kitap Çıkarabilir miyim?",
    summary: "İlk kullanıcı korkusuna en basit yanıtı verir.",
    category: "Başlangıç",
    readTime: "6 dk",
    datePublished: "2024-12-15",
    dateModified: "2025-03-05",
    intro: "Bu soruyu soran herkes aynı noktada takılır: yazmak zor bir beceri gibi görünür, aylarca pratik gerektirir, belki de herkese göre değildir. Oysa rehber kitap ve bilgi kitabı yazmak, edebi roman yazmaktan bambayla farklı bir iştir. Burada güzel cümleler değil, net bilgi ve doğru yapı önemlidir. Gerçekte çoğu insan yazarlıktan değil, başlamaktan korkuyor — ve başlamak için mükemmel bir yazar olmana hiç gerek yok. Doğru bir araç ve net bir konu, seni beklediğinden çok daha hızlı bir kitap sahibi yapabilir.",
    sections: [
      ["Yazarlık korkusu gerçek mi?", "Evet, gerçek — ama çoğu zaman yanlış kaynaktan geliyor. İnsanlar 'iyi bir yazar olmam lazım' diye düşünür; bu düşünce başlamalarını engelleyen en büyük mentol bloğa dönüşür. Oysa bilgi kitabı yazarlığı edebi bir roman yazmaktan tamamen farklıdır. Bir romanda üslup, dil zenginliği ve kurgusal yaratıcılık merkezde yer alır. Rehber kitapta ise okur senden güzel cümleler değil, net bilgi ve pratik yönlendirme bekler. Zaten bildiğin bir konuda birikimini aktarıyorsun — bu bir arkadaşına bir şeyi anlatmaktan pek farklı değil. Bir koç, danışman ya da deneyimli bir uygulayıcı olarak zaten sahip olduğun bilgiyi kağıda dökmek yazarlık değil, aktarım becerisidir. Farklılık sadece yapıda: kitap, konuşmayı belirli bir sıraya sokar ve okura adım adım ilerler. Bu yapıyı kurmak için de çok güçlü bir yazar olmak gerekmez."],
      ["Yazmak ile yönlendirmek farkı", "Geleneksel kitap yazımında her kelimeyi sen üretirsin — boş sayfayla başlarsın, her cümle senden çıkar, her paragraf senin emeğindir. AI destekli kitap üretiminde ise rolün köklü biçimde değişiyor: sen yönlendiriyorsun, sistem taslak üretiyor, sen düzenliyorsun. Bu süreçte yazarlık becerisi değil, içerik kararları alabilmek önemli. Konu ne olacak? Hangi bölümler olacak? Hangi örnekler verilecek? Hangi ton kullanılacak? Bu soruları cevaplayabiliyorsan kitap üretebilirsin. Cümleleri mükemmel kurmak zorunda değilsin — taslağı görüp 'bu doğru mu, eksik mi, değişmeli mi?' diyebilmek yeterli. Bu rol bir editöre ya da proje yöneticisine benziyor: nihai kararlar sende, üretim ağırlığı araçta. Yazarlık korkusunu bu zihinsel çerçeve ile ele almak, çoğu insanın ilk adımı atmasını kolaylaştırıyor."],
      ["AI aracın rolü nedir?", "Book Generator gibi araçlar seni boş sayfayla başa başa bırakmaz. Konu, hedef okur ve ton bilgilerini girdiğinde sistem bir outline önerir — bölüm başlıkları, önerilen sıralama ve genel yapıyla birlikte. Outline'ı onayladığında bölüm içeriklerini üretir; her bölümü ayrı ayrı gözden geçirip düzenleyebilirsin. Her aşamada sana düzenleme, yeniden üretim veya elle yazma seçeneği sunar. Araç bir taslak makinesidir — heykel kaba halde seni bekliyor, sen son şekli veriyorsun. Bu süreçte 'yazarlık' değil, içerik editörlüğü yapıyorsun: hangi bölüm kalacak, hangi cümle değişecek, hangi örnek daha somut hale getirilecek? Bu kararlar senin uzmanlığını yansıtıyor. Araç sadece taslağı hızlı kuruyor; kitabın kalitesi senin düzenleme gözüne ve konu bilgine bağlı."],
      ["Sihirbaz akışı neden fark yaratıyor?", "İlk kullanıcının en büyük engeli boş ekrandır. 'Nereden başlayayım?' sorusu cevapsız kaldığında insanlar ya mükemmeliyetçilikle felç oluyor ya da süreci sonsuza erteliyor. Neyi soracağını bilmeden, nereden başlayacağını bilmeden geçen her dakika motivasyonu düşürür. Wizard akışı bu engeli ortadan kaldırır: sana sırayla yönlendirilmiş sorular sorar, cevaplarına göre ilerler. Konu ne? Hedef okur kim? Kitap kaç bölüm olsun? Ton nasıl olsun? Bu soruları cevapladığında sistemin elinde bir brief var — ve kısa sürede sana bir taslak sunuyor. Boş ekranda sıfırdan başlamak yerine hazır bir yapıyla başlamak, özellikle ilk kitabında devasa bir fark yaratır. Düzeltmek, sıfırdan kurmaktan her zaman daha kolaydır. Wizard seni bu noktaya taşıyor."],
      ["Net amaç mükemmel prompttan üstündür", "AI araçlarıyla çalışırken en sık duyulan tavsiye daha iyi prompt yazmak olur — 'doğru prompt yazmasını bilmiyorum' kaygısı, başlamayı engelleyen bir başka duvar haline gelir. Ama gerçekte asıl fark yaratan şey teknik prompt becerisi değil, içerik netliğidir. Şu üç soruya cevap verebildiğinde sistem zaten çok daha iyi çalışır: Ne anlatmak istiyorum? Kime yazıyorum? Kitabı bitiren okur ne yapabilecek ya da ne bilecek? Bu sorulara net cevabın varsa, sistem bunu işlevsel bir kitap yapısına dönüştürebilir. Teknik prompt becerisine ihtiyaç duymadan, sadece konunu ve amacını samimi biçimde ifade ederek çok iyi sonuçlar alabilirsin. Prompt mühendisliği değil, içerik sahibi olmak asıl güç kaynağı."],
      ["İlk adımı atmak için ne lazım?", "Sadece bir konu. Ve o konuda başkasına anlatabilecek bir şeyin olması — yıllar içinde öğrendiğin bir beceri, defalarca yaşadığın bir süreç, sürekli soru aldığın bir alan. Yazarlık deneyimine, akıcı bir İngilizceye ya da yayıncılık sektörü hakkında uzmanlığa ihtiyacın yok. Book Generator Türkçe arayüzle çalışır ve kitabı istediğin dilde üretir — Türkçe brief gir, İngilizce kitap çıkar. Kayıt olmadan başlayabilirsin: konu girişi yap, 30 saniyede outline ve kapak önizlemeni gör. Beğenmediysen geri dön, konuyu değiştir, farklı bir yön dene. Risk yok, boş sayfa yok, ön bilgi şartı yok. Yazarlık korkusunu aşmanın en iyi yolu tartışmak değil, bir taslak görmektir — ve bunu görmek için sadece bir konu girmen yeterli."],
    ],
  },
  {
    slug: "kitap-fikri-nasil-secilir",
    title: "Kitap Fikri Nasıl Seçilir?",
    summary: "Konu seçimini sadece ilhama değil, okur ve ihtiyaç eşleşmesine bağlar.",
    category: "Araştırma",
    readTime: "8 dk",
    datePublished: "2025-01-10",
    dateModified: "2025-03-10",
    intro: "Kitap fikri bulmak çoğu zaman ilham beklemek gibi hissettirir — bir gün doğru konu kendiliğinden gelecek. Bu bekleme, çoğu zaman kitabın hiç yazılmamasıyla sonuçlanır. Oysa en iyi kitap fikirleri ilhamdan değil, net bir okur ihtiyacıyla örtüşen gerçek bir uzmanlıktan doğar. Konu seçimi bir estetik karar değil, stratejik bir karardır: doğru konuyu seçen yazar hem yazmakta zorlanmaz hem de kitabını satmakta. Bu yazı, konu seçimini sezgiden çıkarıp somut verilere dayanan sistematik bir karar sürecine taşımanı sağlıyor.",
    sections: [
      ["Neden konu seçimi bu kadar önemli?", "Yanlış konuyla başlamak, kitabın her aşamasını zorlaştırır. İçerik dağınık olur çünkü sınırları belli olmayan bir konuyu yapılandırmak güçtür; okur kitlesi belirsizleşir çünkü herkese hitap etmeye çalışan kitap kimseye tam olarak hitap edemez; pazarlama mesajı tutarsızlaşır çünkü kitabın ne vaddettiği net değildir. Öte yandan doğru konu seçimi her şeyi kolaylaştırır: bölüm yapısı kendiliğinden oturur, örnekler aklına daha hızlı gelir, okura hitap etmek kolaylaşır, ve kitabı bitirme motivasyonu yüksek kalır. Konu seçiminde iki temel soru sorulmalı: Bu konuda gerçekten derinlemesine bir şeyler biliyor musun? Ve bu konuyu arayan, bu soruya para harcamaya hazır gerçek bir kitle var mı? Her ikisine de evet diyebiliyorsan sağlam bir başlangıç noktasındasın."],
      ["Bildiğin şeyi seç", "Uzmanlık ya da deneyim temeli olmayan konular, içerik derinliğini hızla düşürür. Genel bilgilerden oluşan, internette zaten bulunan bilgileri tekrar eden bir kitap okuyucuya değer katmaz. Okur neden parasını ve zamanını harcasın? Ama kendi deneyiminden süzülmüş, gerçek örneklerle desteklenmiş, bir alanda defalarca karşılaşılan sorunlara gerçek cevaplar veren bir kitap çok daha güçlüdür. Örneğin, yıllarca e-ticaret işleten biri 'Dropshipping Nedir?' değil, 'İlk Siparişten Önce Yapmanız Gereken 7 Tedarikçi Testi' gibi spesifik ve deneyim temelli bir kitap yazabilir — bu kitabın değeri, birinin araştırıp derlediği bilgiden çok daha yüksektir. Yazmak istediğin konuda başkasına öğretebileceğin, insanların sana danıştığı, gerçek sonuçlar ürettiğin bir alanı seç. Bu alan senin rakipsiz avantajın."],
      ["Sorun odaklı düşün", "İnsanlar kitap satın alırken genellikle iki şeyden biri için ödeme yapıyor: bir sorunu çözmek ya da bir hedefe ulaşmak. Bu yüzden en çok satan non-fiction kitaplar çoğunlukla net bir problemi ele alan kitaplardır. 'Fotoğrafçılık üzerine bir kitap' geniş ve belirsizdir — ama 'Düşük Işıkta Çekim: Ekstra Ekipman Olmadan Profesyonel Sonuç' çok daha güçlü ve hedefe yönelik bir konudur. Konu ne kadar spesifik ve ne kadar somut bir sorunu çözüyorsa hedef okurla o kadar hızlı bağ kurar. Konunu belirlerken şu iki soruyu sor: 'Bu kitabı kim okur?' ve 'Okuduktan sonra ne yapabilecek ya da ne bilecek?' Bu iki soruya net cevap verebildiğinde konu hem içerik üretimi hem de pazarlama açısından çok daha güçlü hale gelir. Belirsiz konu, belirsiz okur, belirsiz satış anlamına gelir."],
      ["Pazar talebini nasıl ölçersin?", "İyi bir fikrin gerçek talep bulduğundan emin olmak için harcayabileceğin iki-üç saat, sonraki aylardaki satış hayal kırıklığının önüne geçer. Amazon'da konuya yakın kitaplara bak: kaç başlık var, bu kitaplar ne zaman yayınlandı, en iyi satanların yorumlarında okurlar neyi beğeniyor ve neyi eleştiriyor? Yorumlar son derece değerli bir veri kaynağıdır: okurların beğenmediği eksiklikler senin kitabının fırsatıdır. Google Trends'te konunun arama hacmini ve trend yönünü kontrol et — artıyor mu, azalıyor mu, mevsimsel mi? Reddit ve Quora'da insanların bu konuda hangi soruları sorduğuna bak: insanların sormaktan çekinmediği sorular, gerçek bilgi açığını gösterir. Bu araştırmayı yapmadan konuna karar vermek, gözleri kapalı bir işe girişmek gibidir."],
      ["KDP keyword araştırması", "Amazon KDP'de yayın yapmayı düşünüyorsan keyword araştırması, konu seçimi sürecinin ayrılmaz bir parçası olmalı. KDP'de anahtar kelimeler hem arama sonuçlarında görünürlüğü hem de kategori sıralamasını doğrudan etkiler. Ücretsiz ve etkili bir başlangıç için Amazon'un kendi arama çubuğunu kullan: konuyla ilgili bir kelime girdiğinde çıkan otomatik tamamlama önerileri, gerçek kullanıcıların ne aradığını yansıtır. Bu öneriler hem popüler aramaları hem de henüz kitapların az olduğu niş alıları gösterebilir. Daha derinlemesine araştırma için Publisher Rocket, Book Bolt veya Helium 10 gibi araçlar aylık arama hacmi ve rekabet yoğunluğu verisi sunar. Hedef şudur: yeterince aranıyor ama yeterince rakip kitap yok. Bu kesişim noktası, yeni bir kitabın en hızlı ivme kazanabileceği alandır. Keyword araştırmasını konu seçiminin önüne koymak yerine seçimin teyidi olarak kullanmak en sağlıklı yaklaşımdır."],
      ["Rekabeti doğru değerlendirmek", "Yüzlerce kitabın olduğu bir niş kötü işaret değildir — aksine talebin güçlü kanıtıdır. İnsanlar o konuya para harcıyor demektir. Ama bu nişte sıyrılmak için farklı bir açı sunman gerekir. Rakip kitaplardaki bir yıldız ve iki yıldız yorumlarına özellikle dikkat et: okurlar ne eksik buluyor, hangi sorular cevaplanmamış kalıyor, hangi bölümler çok teorik ya da çok yüzeysel bulunuyor? Bu şikayetler senin kitabının vaat cümlesi haline gelir: 'Rakiplerin üç yıldız aldığı sorunu ben çözüyorum.' Örneğin, muhasebe yazılımları hakkında çok kitap var ama hepsi teorik kalıyorsa, sen 'Serbest Çalışanlar İçin Pratik Muhasebe: Yazılım Adım Adım' başlığıyla o boşluğu doldurabilirsin. Hiç rakibin olmayan niş ise gerçekten tehlikeli olabilir — ya talep yok ya da kimse o konuya para harcamak istemiyor. İkisi de iyi senaryo değil."],
      ["Son karar: sezgi mi, veri mi?", "İkisi birden — ama ikisi de tek başına yeterli değil. Veri talep olduğunu kanıtlar ve hangi konunun daha fazla potansiyel taşıdığını gösterir. Sezgi ise o konuyu yazarken gerçekten katma değer üretip üretemeyeceğini, süreçte motivasyonu koruyup koruyamayacağını ortaya koyar. Verisi güçlü ama hiç ilgini çekmeyen bir konuyu seçersen içerik üretimi sıkıcı ve zorlayıcı bir hal alır — çoğunlukla yarım kalır. İlgini çeken ama talebini doğrulayamadığın bir konuyu seçersen aylarca emek ver, satış hayal kırıklığıyla karşılaşırsın. İkisinin kesiştiği nokta, hem bilgi ve deneyim sahibi olduğun hem de gerçek bir okur kitlesinin arayıp para harcadığı konudur. Bu kesişimi bulmak için zaman harcamak, her şeyin geri kalanını kolaylaştırır. Book Generator araştırma merkezi bu süreçte konu belirleme ve keyword analizinde somut veri sunarak karar sürecini destekler."],
    ],
  },
  {
    slug: "ingilizce-kitap-icin-nasil-brief-verilir",
    title: "İngilizce Kitap İçin Nasıl Brief Verilir?",
    summary: "Türkçe arayüzden İngilizce kitap üretirken daha iyi sonuç almanın kısa yolunu gösterir.",
    category: "Prompting",
    readTime: "7 dk",
    datePublished: "2025-01-20",
    dateModified: "2025-03-15",
    intro: "Türkçe konuşan biri olarak İngilizce kitap üretmek artık mümkün — ama dil değişince brief yazmanın kuralları da değişiyor. Hedef kitle farklı, ton beklentisi farklı, kelime seçimi farklı. İyi bir brief, AI sisteminin doğru dili, doğru tonu ve doğru içerik derinliğini yakalamasını sağlar. Bu yazı sana ne yazacağını değil, nasıl brief vereceğini öğretiyor.",
    sections: [
      ["Brief neden bu kadar belirleyici?", "AI sistemi senin niyetini, geçmişini veya hedefini bilmiyor — sadece verdiğin bilgiye göre üretiyor. Brief ne kadar net olursa çıktı o kadar hedefe yakın olur. Belirsiz bir brief 'genel' bir kitap üretir: herkes için yazılmış gibi görünen, kimseye tam hitap etmeyen, tonu tutarsız bir içerik. Spesifik bir brief ise belirli bir okur için belirli bir sorunu çözen, tutarlı bir sese sahip, gerçek değer sunan bir kitap ortaya koyar. İngilizce içerikte bu fark daha da kritik hale gelir çünkü ton, register ve okur beklentisi Türkçe içerikten önemli ölçüde ayrışır. İngilizce kitap okuyucuları genellikle doğrudan, aksiyon odaklı ve jargonsuz bir dil bekler. Bu beklentiyi karşılamak için sistemin onu anlaması gerekir — ve sisteme bunu anlatan tek şey senin brief'in. Ne kadar özen gösterirsen çıktı kalitesi o kadar artar ve düzeltme süren o kadar kısalır."],
      ["Hedef okuru İngilizce ve spesifik tanımla", "Brief'in en kritik ve en çok ihmal edilen bölümü hedef okur tanımıdır. 'Professionals' ya da 'beginners' demek yetmez — bu tanımlar sisteme neredeyse hiç işe yarar bilgi vermiyor. Hangi sektörde çalışıyor? Hangi deneyim seviyesinde? Hangi coğrafyada? Hangi sorunla boğuşuyor? Örneğin şu fark muazzam: 'business owners' yerine 'solo e-commerce founders in the US, running Shopify stores, 1-3 years in business, struggling with customer retention after first purchase.' Bu kadar spesifik bir tanım, sistemin ton seçimini, kelime düzeyini, örnek türünü ve hatta bölüm sıralamasını doğrudan etkiler. Okuru ne kadar detaylı tanımlarsan çıktı o kadar isabetli ve okura 'bu kitap benim için yazılmış' hissi verir. Hedef okur tanımını yazmak 5 dakika alır ama çıktı kalitesini katlar."],
      ["Ton ve stil cümlesi ekle", "İngilizce içerikte ton belirlemek kritik bir adımdır ve çoğu kullanıcı atlıyor. Akademik mi, conversational mı, authoritative mi, friendly mi? Bu fark, okuyucunun kitabı bitirip bitirmeyeceğini belirleyebilir. Kısa bir stil cümlesi sisteme çok net sinyal verir. Örnek: 'Clear, concise, actionable — like a smart friend who knows the subject deeply and doesn't waste your time.' Ya da: 'Professional but approachable, no jargon, real-world examples from small business owners.' Ya da: 'Direct and data-driven, like a Harvard Business Review article but shorter and more practical.' Bu tek cümle, sistemin tüm bölümlerde tutarlı bir ses oluşturmasını sağlar. Ton belirtilmediğinde sistem genellikle nötr ve biraz formal bir dil seçer — bu çoğu rehber kitap için doğru değil ve okuru ilk sayfadan uzaklaştırabilir."],
      ["Bölüm derinliğini ve kapsamı baştan belirle", "Kısa bir quick guide mi istiyorsun, yoksa kapsamlı bir playbook mu? 50 sayfa mı, 150 sayfa mı? Her bölüm kaç alt konu içermeli? Bölümlerin pratik egzersiz veya checklist içermesini istiyor musun? Bu kararları brief'te önceden belirtmek hem üretim kalitesini artırır hem de sürpriz çıktılarla zaman kaybetmeni önler. Örnek bir derinlik talimatı: 'Each chapter should cover one focused concept, have 3-4 subsections, include at least one real-world example and one actionable takeaway. Chapters should be 800-1200 words each.' Bu talimatla sistem sana 10 bölümlük, tutarlı uzunlukta ve her biri pratik değer sunan bir içerik üretir. Kapsamı belirtmenin bir diğer faydası: sistemin konuyu gereksiz yere genişletmesini önler. 'Bu konuyu kapsama alma' şeklinde bir dışlama listesi de çok değerlidir — neyin olmayacağını bilmek, sistemin odağını korur."],
      ["Kullanabileceğin brief şablonu", "İşte doğrudan kopyalayıp doldurabileceğin bir şablon: Book title: [başlık]. Target reader: [çok spesifik tanım — sektör, deneyim, sorun]. Book goal: [okur kitabı bitirdiğinde ne yapabilecek — tek cümle]. Tone: [stil tanımı]. Scope: [kaç bölüm, her bölüm kaç kelime]. Exclude: [bu kitapta olmayacak konular]. Language notes: [American English mi, British mi? Jargon kabul edilir mi?]. Bu son iki alan genellikle unutuluyor ama çok önemli. 'Exclude' listesi sistemin kapsam dışına çıkmasını engeller. 'Language notes' ise özellikle KDP'de Amerika pazarını hedefliyorsan American English kullanımını garanti eder — İngiliz İngilizcesi bir Amerikan kitabında olumsuz yorum alabilir. Şablonu doldurmak 10 dakika alır; kazandırdığı zaman ve kalite farkı buna değer."],
      ["Sık yapılan hatalar ve nasıl önlenir?", "En yaygın hata: brief'i Türkçe vermek. Sistem dili anlasa da hedef okur tanımını, ton kararını ve kapsam sınırlarını İngilizce yazmak tutarlılığı artırıyor. Türkçe brief, sistemi iki dil arasında gidip gelen bir çeviri moduna sokabiliyor ve çıktıda kayma yaratıyor. İkinci hata: konu çok geniş. 'Digital marketing for beginners' yerine 'Instagram Reels strategy for personal trainers with under 5,000 followers' çok daha güçlü ve çok daha hedefe yönelik içerik üretiyor. Niş ne kadar dar olursa kitap o kadar güçlü oluyor. Üçüncü hata: ton belirtmemek. Dördüncü hata: okur tanımını belirsiz bırakmak. Beşinci hata: kapsamı sınırlamamak — sınır vermediğinde sistem konu dışına çıkacak bölümler ekleyebiliyor. Bu hatalardan sadece birini düzeltmek bile çıktı kalitesini fark edilir biçimde artırıyor."],
      ["Brief'ten çıktıya: ne beklemeli?", "İyi bir brief verdiğinde bile ilk taslak %100 mükemmel olmayabilir — bu normal ve beklenen bir durum. AI üretimi bir başlangıç noktasıdır, bitmiş ürün değil. Çıktıyı aldığında şu soruları sor: Ton hedef okura uygun mu? Örnekler gerçekçi ve kültürel olarak doğru mu? Bölüm akışı mantıklı mı? Dil seviyesi okura uygun mu — çok teknik mi, çok basit mi? Bu değerlendirmeyi bölüm bölüm yap ve sorunlu alanları yeniden üret ya da elle düzenle. Brief ne kadar iyi olursa bu düzeltme turu o kadar kısa sürer. Hedef: brief'i o kadar net yaz ki ilk turda %80 kullanılabilir içerik gelsin, kalan %20'yi kişisel ses, özgün örnekler ve ince ayarlarla tamamla. Bu oran sağlandığında İngilizce kitap üretimi gerçekten verimli bir sürece dönüşür."],
    ],
  },
  {
    slug: "ilk-kitabim-kac-bolum-olmali",
    title: "İlk Kitabım Kaç Bölüm Olmalı?",
    summary: "İlk kitapta fazla bölüm açmanın neden çoğu zaman hata olduğunu açıklar.",
    category: "Yapı",
    readTime: "6 dk",
    datePublished: "2025-02-01",
    dateModified: "2025-03-20",
    intro: "İlk kitabını planlarken kaç bölüm olacağına karar vermek düşündüğünden daha önemli. Çok az bölüm yüzeysel görünür, çok fazla bölüm ise odak kaybettirir. Ama sayı aslında ikincil bir soru — önce her bölümün ne yapması gerektiğini anlamak lazım.",
    sections: [
      ["Bölüm sayısı kaliteyi belirlemez", "20 bölümlük bir kitap 7 bölümlük kitaptan daha değerli değildir. Aksine, çok bölümlü kitaplarda her bölüm daha ince kalır, içerik tekrar eder ve okur odağını kaybeder. Bölüm sayısı bir prestij göstergesi değil, bir yapı kararıdır. Asıl soru şu: kitabında kaç tane farklı, birbirini destekleyen ana fikir var? O sayı bölüm sayını belirlemeli. Çok fazla bölüm açmanın yaygın sebebi şudur: konu 'büyük' hissettiriyor ve her alt konuyu ayrı bir bölüm olarak planlamak mantıklı geliyor. Ama çoğu zaman bu alt konular tek bir bölümün içindeki alt başlıklar olarak çok daha iyi çalışır. Bölüm = bağımsız, tamamlanmış bir fikir. Alt başlık = o fikrin bir boyutu. Bu ayrımı netleştirmek kafa karışıklığını bir anda gideriyor."],
      ["Başlangıç için ideal aralık nedir?", "Çoğu pratik rehber ve bilgi kitabı için 5 ila 8 bölüm sağlam bir başlangıç noktasıdır. Bu aralık yeterince derinlik sunar ama okuru bunaltmaz. Her bölüm bir ana fikri veya bir adımı kapsıyor, kitap boyunca bir dönüşüm ya da öğrenme süreci ilerliyor — bu yapı hem okunması hem yazılması kolay bir kitap ortaya koyar. Peki bu sayı nereden geliyor? Pratik rehberlerin okur psikolojisiyle ilgili bir gerçeği var: okur, kitabı eline aldığında içindekiler tablosuna bakıyor ve bölüm sayısına göre 'bu kitabı bitirebilir miyim?' sorusunu soruyor. 5-8 bölüm hem yeterince kapsamlı görünüyor hem de ulaşılabilir. 15-20 bölüm ise çoğu okurda 'bunu tamamlayamam' hissini tetikliyor. İlk kitabın daha kısa çıkması sorun değil — asıl önemli olan tamamlamaktır."],
      ["Ne zaman daha fazla bölüm gerekir?", "Bazı kitap türleri gerçekten daha fazla bölüm gerektiriyor. Adım adım ilerleyen teknik rehberler, her adımın ayrı bir bölüm olmasını zorunlu kılabilir. Birden fazla farklı konuyu ele alan antoloji tarzı kitaplar ya da her bölümün bağımsız okunabildiği referans kitaplar da daha yüksek bölüm sayısına gidebilir. Bu durumlarda 10-15 bölüm makul. Ama 15'in üzeri çoğu rehber kitap için tehlike bölgesidir — içerik seyrelmesi, tekrar ve odak kaybı kaçınılmaz hale gelir. Eğer 15 bölüm planlamış ama içerik ince kalıyorsa, bölümleri birleştirip derinleştirmek her zaman daha iyi sonuç verir. Hacim hedefi için bölüm sayısını artırmak yanlış bir stratejidir."],
      ["Her bölümün uzunluğu ne olmalı?", "Pratik rehberlerde bölüm başına 1500-3000 kelime — yaklaşık 6-12 sayfa — çoğu bölüm için doğru aralıktır. Bu kadar kelimeyle bir fikri derinlemesine işleyebilir, somut örnek verebilir ve okura aksiyon adımları bırakabilirsin. 500 kelimenin altındaki bölümler genellikle yüzeysel hissettiriyor; okur 'bu kadar mı?' sorusunu soruyor. 5000 kelimenin üzerindeki bölümler ise okuru yoruyor ve konuya hakim olmayan birisinin dağınık yazısı izlenimini yaratıyor. Tutarlı uzunluk da önemli — bölümler arasında 3 kat uzunluk farkı kitabın dengesiz görünmesine neden oluyor. Hedef: her bölüm benzer bir ağırlık taşısın, okur ritmi tutarlı kalsın."],
      ["Bölüm başlıklarını nasıl planlamalı?", "İyi bir bölüm başlığı okura ne öğreneceğini söyler — merak uyandırır ama yanıltmaz. 'Giriş', 'Temel Kavramlar' ya da 'Özet' gibi belirsiz başlıklar yerine 'İlk 30 Günde Müşteri Tabanını Nasıl Kurarsın?' veya 'Fiyatlandırmada 3 Hata ve Nasıl Önlenir?' gibi somut başlıklar okuru sayfaya çeker. Bölüm başlıklarını yan yana koyduğunda bir mantık akışı görünmeli — içindekiler tablosuna bakan okur kitabın öğretme sırasını hissedebilmeli. Başlıklar aynı zamanda SEO açısından da önemlidir: e-kitap platformlarında bölüm başlıkları arama algoritmalarına sinyal verir. Book Generator wizard'ı başlık önerileri sunar, sen istersen tek tek değiştirebilirsin."],
      ["Küçük başlamanın avantajları", "5-7 bölümle başlamak hem üretimi hem de düzenlemeyi kolaylaştırır, hem de kitabı bitirebilme ihtimalini ciddi ölçüde artırır. Daha az bölüm = daha hızlı tamamlama = daha erken yayın = daha erken geri bildirim. Tamamlanan bir kitap, yarım kalan ama 'çok daha kapsamlı ve mükemmel' olmak üzere planlanan bir kitaptan her zaman daha değerlidir. Kitabını yayına girdiğinde okurlardan gerçek geri bildirim alırsın; ikinci baskıda ya da sıradaki kitapta kapsamı genişletebilirsin. Bu iteratif yaklaşım hem riski azaltır hem de içeriğini gerçek taleple şekillendirmeni sağlar. Küçük başlamak disiplindir — büyük planlar yapmak ise çoğu zaman ertelemenin kibar bir adıdır."],
    ],
  },
  {
    slug: "ai-taslagi-nasil-duzeltilir",
    title: "AI Taslağı Nasıl Düzeltilir?",
    summary: "Ham taslağı daha güvenli ve daha insani hale getirmek için kısa düzenleme yöntemi sunar.",
    category: "Düzenleme",
    readTime: "7 dk",
    datePublished: "2025-02-15",
    dateModified: "2025-03-25",
    intro: "AI taslağını aldın — ama tam istediğin gibi değil. Bazı bölümler fazla genel, bazı cümleler çok mekanik, bazı yerlerde aynı fikir tekrar ediyor. Bu normal. AI üretimi sıfırdan başlamanın önüne geçer ama taslağı bitmiş ürün gibi kullanmak çoğunlukla yanlış bir karar. Bu yazı, ham taslağı gerçekten senin kitabına dönüştürmek için izlemen gereken kısa düzenleme sürecini anlatıyor.",
    sections: [
      ["Ham taslak neden düzenleme gerektirir?", "AI sistemi konuyu biliyor ama seni bilmiyor. Kişisel deneyimlerini, spesifik örneklerini, ses tonunu ve hedef kitlenle kurduğun özel bağı taşıyamıyor. Üretilen içerik doğru ve tutarlı olsa bile genellikle 'herkesin yazabileceği' bir dil kullanır — özgün değildir, kişisel değildir, seninle aynı alanda çalışan rakibinin kitabından ayırt edilemez. Düzenleme tam da bu özgünlüğü eklemek için vardır. Bunun yanı sıra sistem zaman zaman tekrar eder; aynı fikri farklı kelimelerle, farklı bölümlerde yineler. Bağlamdan kopuk cümleler kurar. Hedef okur için fazla teknik ya da tersine fazla basit bir seviye seçer. Bunları fark edip düzeltmek senin işin — ve bu fark etme kapasitesi, konuya olan hakimiyetinden geliyor. Taslağı bitmiş ürün gibi sunmak büyük bir hata; düzenlenerek sunulan taslak ise gerçek bir kitaba dönüşür."],
      ["Önce yapıya bak", "Kelime kelime düzeltmeye başlamadan önce büyük resme bak. Bölüm sırası mantıklı mı? Her bölüm, bir öncekinin üzerine inşa ediyor mu? Kitap baştan sona ilerlerken okur gerçekten bir şey öğreniyor ya da dönüşüm yaşıyor mu — yoksa sadece birbirinden bağımsız bilgi parçaları sıralanmış mı? Yapısal sorunları cümle düzeltmeden önce çözmek şarttır. Çünkü silinecek ya da taşınacak bir bölümün içindeki cümleleri düzeltmek saf zaman kaybıdır. Yapıyı kontrol etmek için içindekiler tablosunu oku — sadece başlıklara bakarak akış anlaşılabiliyor mu? Her bölümün ilk cümlesini oku — 'bu bölüm ne anlatıyor?' sorusu ilk cümlede cevap bulunabiliyor mu? Bu iki kontrol, yapısal sorunların büyük çoğunluğunu dakikalar içinde ortaya çıkarır."],
      ["Tekrarları temizle", "AI sistemleri zaman zaman aynı fikri farklı bölümlerde, farklı kelimelerle tekrar eder. Bu özellikle giriş ve özet paragraflarında sık görülür — her bölüm kendi başına başlar ve biter, bu yüzden sistem önceki bölümlerde ne söylendiğini bağlam olarak tam taşıyamayabilir. Her bölümü tararken şunu sor: 'Bu fikri daha önce anlattım mı? Okur bunu zaten öğrendi mi?' Yanıt evet ise o bölümü ya sil ya da başka bir bölümle birleştir. Tekrar çok ciddi bir sorundur çünkü iki mesajı aynı anda verir: içerik yeterli değil, dolgu malzemesiyle uzatılmış; ve yazar ne söylediğini takip edemiyor. Bu mesajların her ikisi de okurda güven kaybına yol açar. Tekrarlardan kurtulmak kitabı kısaltır ama güçlendirir."],
      ["Kendi sesini ekle", "Bu, düzenlemenin en önemli ve en değerli adımıdır. AI'ın yazdığı metni bir iskelet olarak düşün — kemikleri yerli yerinde ama eti, kanı, karakteri sen ekleyeceksin. Kişisel bir deneyim ekle: kendin yaşadın, bir müşterinden duydun, bir projede gördün. Bir cümleyi konuşur gibi yaz — 'Bu önemlidir' yerine 'İlk kez gördüğümde bunu anlamak on dakikamı aldı, ama fark ettikten sonra her şey değişti.' Bir bölümde okura doğrudan hitap et: 'Eğer sen de...'. Gerçek bir sayı ya da somut bir veri ekle. Bu küçük dokunuşların her biri kitabı sıradan bir AI çıktısından ayıran ve okurla gerçek bir bağ kuran unsurlardır. Onlar olmadan kitap bilgi verir; onlarla birlikte kitap güven verir."],
      ["Gerçek örnekler ve somut detaylar", "AI taslakları çoğunlukla soyut ya da jenerik örnekler kullanır: 'bir şirket bu stratejiyi uyguladı ve başarılı oldu.' Bu tür örnekler okura hiçbir şey söylemez — kimdir bu şirket, ne yaptı, nasıl başarılı oldu, ne kadar sürdü? Soyut örnekler yerine somut ve tanıdık örnekler koy. Gerçek bir şirket adı, gerçek bir sayı, kendi deneyiminden bir senaryo, ya da çok spesifik bir durum: 'Müşterilerinden biri 3 ay boyunca denedi, şunu değiştirdi, şu sonucu aldı.' Okur somut örneklerle bağ kurar çünkü onlarda kendini görebilir. Soyut açıklamalar bilgi verir ama inandırıcılık yaratmaz. Bu değişiklik hem güvenilirliği hem okunabilirliği hem de bırakılan izlenimi köklü biçimde iyileştirir."],
      ["Ne zaman yeniden üretmeli, ne zaman düzeltmeli?", "Bu sorunun pratik cevabı şudur: değişikliğin büyüklüğüne bak. Eğer bir bölümde birkaç cümle değiştireceksen, bir iki paragraf yeniden yazacaksan — düzelt. Elle düzenleme bu ölçekte daha hızlı. Ama eğer bölüm tamamen yanlış yönde gitmişse, hedef okura hiç uygun değilse, ton bölümden bölüme tutarsızsa ya da kapsam dışına çıkmışsa — yeniden üret. Book Generator bölüm bazında yeniden üretim yapmanıza olanak tanır: tek bir bölümü seç, farklı bir brief ya da ton talimatı ver, yeniden üret. Bu, tüm kitabı baştan üretmekten çok daha hızlı. Pratik kural: az düzeltme yetiyorsa düzelt; köklü değişim gerekiyorsa yeniden üret ve üzerine inşa et."],
      ["Son okuma ritueli", "Düzenleme bittikten sonra kitabı bir kez daha baştan sona oku — ama bu sefer farklı bir gözle: hedef okurunu hayal et, onun yerine geçerek oku. Bu kişi kitabı okuduğunda ne hisseder? Anlaşılmayan bir yer var mı? Sıkıcı, tekrarcı ya da fazla ağır bir bölüm var mı? Kitabın vaadi — önsözde verdiği söz — son bölümde karşılanmış mı? Bu son okuma küçük iyileştirmeleri ve gözden kaçanları görünür kılar. Aynı zamanda sana en önemli sinyali de verir: kitap bitti mi değil miydi? Mükemmel olmak zorunda değil — yayınlanmaya hazır olmak zorunda. Bu ayrımı fark etmek, çoğu kitabın tamamlanmasını sağlar."],
    ],
  },
  {
    slug: "kapak-secerken-en-onemli-5-sey",
    title: "Kapak Seçerken En Önemli 5 Şey",
    summary: "Kapak kararını estetik yerine işlev odaklı vermeye yardımcı olur.",
    category: "Kapak",
    readTime: "7 dk",
    datePublished: "2025-03-01",
    dateModified: "2025-03-28",
    intro: "Kapak seçimi çoğu zaman estetik bir karar gibi görünür — ama aslında stratejik bir karardır. İyi bir kapak kitabın türünü anlatır, doğru okuru çeker ve profesyonellik sinyali verir. Kötü bir kapak içerik ne kadar iyi olursa olsun okuru kaçırabilir. Bu yazı, kapak kararını güzel yerine işlevsel kılmak için dikkat etmen gereken beş temel noktayı anlatıyor.",
    sections: [
      ["Kapak bir pazarlama aracıdır", "Kapağın tek işi güzel görünmek değil, satmak. Amazon listelerinde, sosyal medya paylaşımlarında ya da web sitesinde kapağın yapması gereken tek şey şudur: doğru okuru durdurmak ve tıklatmak. Bunu yapabilmesi için estetik tercihlerden önce işlevsel sorulara cevap vermesi gerekir: Bu kapak hedef okurum için mi tasarlandı? Kitabın türünü ilk bakışta anlatıyor mu? Rakip kitaplarla aynı görsel dili konuşuyor mu? Bu sorulara 'evet' diyebiliyorsan kapak işini yapıyor demektir. Peki neden bu kadar önemli? Çünkü bir kitabın Amazon'daki tıklanma kararı genellikle 2-3 saniye içinde veriliyor — başlık ve kapak bu sürede okuru ya içeri çekiyor ya da geçirip gönderiliyor. İçerik ne kadar iyi olursa olsun, okur sayfaya tıklamazsa hiçbir önemi kalmıyor. Kapak bu anlamda kitabın en önemli pazarlama yatırımıdır."],
      ["Kitabın türü hemen anlaşılmalı", "Farklı kitap türlerinin farklı görsel dili var ve okurlar bu dili bilinçaltında çok hızlı okuyorlar. İş ve kariyer kitapları genellikle temiz, minimalist, tipografi ağırlıklı kapaklar kullanır — arka plan sade, yazı büyük ve net, görsel varsa soyut ya da minimal. Kişisel gelişim kitapları daha sıcak renkler, ilham verici görseller, zaman zaman yazarın fotoğrafı ile çalışır. Teknik rehberler net ve sade bir düzen tercih eder — ikon, diyagram ya da ekran görüntüsü sık kullanılır. Okur kapağa bakarken bu sinyalleri farkında olmadan okur ve 'bu kitap benim türümden mi?' sorusunu yanıtlar. Eğer kapağın görsel dili kitabın türüyle uyuşmuyorsa okur kafa karışıklığı yaşar ve geçip gider. Hedeflediğin kategorideki en çok satan 10 kitabın kapağına bakmak, o kategorinin görsel dilini öğrenmenin en hızlı yolu."],
      ["Başlık küçük boyutta da okunabilmeli", "Amazon listelerinde kitabın bir thumbnail olarak göründüğünü unutma — çoğu zaman 80x110 ile 150x200 piksel arasında küçük bir dikdörtgen. Bu boyutta kapağın yapması gereken tek şey başlığı okunabilir kılmaktır. Büyük puntolu, yüksek kontrastlı tipografi bu yüzden şarttır. 'Şık' görünen ince, dekoratif ya da script fontlar küçük boyutta okunamaz hale gelir. Çok fazla kelime sığdırmaya çalışma — ana başlık kapağın en büyük yazısı olmalı, alt başlık varsa daha küçük ama yine okunabilir. Kapağı üretmeden önce 150x200 piksele küçültüp kontrol et: 5 saniyede başlık okunabiliyor mu? Eğer hayırsa kapak büyük boyutta ne kadar güzel olursa olsun platform listelerinde başarısız olacak."],
      ["Renk ve kontrast işlevseldir", "Renk seçimi hem estetik hem de pratik bir karardır — ama pratik boyutu çok daha belirleyici. Yüksek renk kontrastı okunabilirliği artırır: açık zemin üzerinde koyu metin ya da tam tersi en güvenli seçimdir. Doygunluğu düşük ya da çok benzer tonlardan oluşan renkler küçük boyutta iç içe geçer ve başlık zemine karışır. Sektöre özgü renk dilini de göz önünde bulundur: finans ve iş kitapları için lacivert, koyu gri ve altın ton güven ve profesyonellik sinyali verir. Sağlık ve wellness kitapları için yeşil ve beyaz yaygındır. Kişisel gelişim kitaplarında turuncu, sarı ve canlı renkler enerji ve motivasyon çağrışımı taşır. Rastgele renk seçimi yerine kategorideki başarılı kitapları incele ve hangi renk paletinin o kategoride işe yaradığını gözlemle. Ardından bu paletten yola çıkarak farklılaş — tamamen kopuk değil, tanıdık ama ayırt edici."],
      ["Sadelik genellikle kazanır", "Kapak tasarımında en sık yapılan hata: çok fazla eleman sıkıştırmak. Birden fazla ana görsel, çok fazla metin, karmaşık arka plan deseni, çok sayıda renk, birden fazla yazı tipi — bunların bir arada kullanımı 'profesyonellik' vermez, aksine dağınıklık verir. En etkili kapaklar genellikle tek bir güçlü konsept, net bir başlık ve minimal bir düzenden oluşur. Okuru neye bakacağını bilmeden bırakma — gözünün ilk nereye gideceğini tasarla. Kapakta bir odak noktası olsun ve bütün diğer elemanlar bu odağı desteklesin. Bazen sadece güçlü tipografi ve sade bir arka plan rengi, karmaşık illüstrasyonlu bir kapaktan çok daha güçlü çalışır. Karmaşıklık pahalıya mı mal oldu? İyi tasarımcı paraya mı mal oldu? Sade ama etkili bir kapak, pahalı ama kalabalık bir kapaktan her zaman daha değerlidir."],
      ["KDP teknik gereksinimlerini karşıla", "Dijital kitap için KDP minimum 1000 piksel genişlik, ideal olarak 2560x1600 piksel çözünürlük ve 1.6:1 en boy oranı gerektiriyor. Bu şartları karşılamayan kapaklar ya yükleme sırasında reddediliyor ya da platformda pikselleşmiş ve bulanık görünüyor — her iki durum da profesyonellik algısını anında zedeliyor. Baskılı kitap için ön kapak, sırt ve arka kapak birleşik tek PDF olarak hazırlanmalı; sırt genişliği sayfa sayısına göre değişiyor ve KDP kendi ücretsiz şablon hesap aracını sunuyor. Renk uzayı CMYK değil RGB olmalı (dijital için), dosya formatı JPEG ya da TIFF tercih edilmeli. Book Generator kapak çıktılarını bu gereksinimlere uygun üretir — ama kendi tasarımını kullanıyorsan veya dışarıdan bir tasarımcıdan alıyorsan bu teknik gereksinimleri ilk toplantıda paylaş."],
      ["Son test: thumbnail ve rakip karşılaştırması", "Kapağı tamamladıktan sonra iki kısa test yap. Birinci test: kapağı 150x200 piksele küçült ve başlığın hâlâ okunabilir olup olmadığını kontrol et. Bu simülasyon sana Amazon listelerindeki gerçek görünümü gösterir. İkinci test: hedef kategorindeki 10-15 kitabın kapak görsellerini yan yana koy ve kendi kapağını aralarına ekle. Dikkat çekiyor mu? Kategoriye uygun görünüyor mu ama yeterince farklı mı? Kategorinin dilini konuşmak ve ayırt edici olmak aynı anda mümkün — ama kategorinin görsel dilini tamamen reddeden bir kapak okurda güvensizlik yaratır. Bu iki test toplam 10 dakika alır ve yayın öncesinde büyük sorunları yakalamanı sağlar. Kapak kararını mükemmeliyetçilikle sonsuz uzatmak yerine bu iki testi geç ve yayınla."],
    ],
  },
] as const;
