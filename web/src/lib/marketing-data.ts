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
  "Bölüm bölüm outline ve çalışma omurgası",
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
    title: "Başlık ve outline onayla",
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
    text: "Premium'a geç, tam kitabı aç, export et. Amazon KDP veya kendi kanalına yükle.",
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
    title: "Outline'i onayla, üretimi başlat",
    text: "AI başlık, bölüm akışı ve brief önerir. Sen düzenler, onaylarsın. Sonra tek tıkla tüm kitabı üretirsin.",
  },
  {
    step: "3",
    title: "EPUB ve PDF'ini al",
    text: "Önizlemeyi gör, beğenirsen tam kitabı aç. Export dosyaları KDP'ye yüklemeye hazır gelir.",
  },
] as const;

export const premiumPlan = {
  id: "premium",
  name: "Tek Kitap",
  price: "$4",
  interval: "tek seferlik",
  label: "1 kitap — abonelik yok, sonsuza sahip ol",
  description: "Fikrin var, kitap mı olur diye merak ediyorsun. $4 ile tam erişim aç — outline, tüm bölümler, kapak ve EPUB/PDF çıktısı. Bir kez öde, dosyalar senindir.",
  badge: "Dene ve karar ver",
  perUnit: null,
  features: [
    "1 tam kitap — tüm bölümler kilitsiz",
    "AI kapak üretimi — 3 stil, özel renk paleti",
    "EPUB + PDF export — KDP'ye yüklemeye hazır",
    "Çok dilli üretim (Türkçe, İngilizce ve daha fazlası)",
    "Ton ve hedef kitle ayarı (wizard'dan)",
    "30 gün iade garantisi — risk yok",
  ],
} as const;

export const plans = [
  {
    id: "starter",
    name: "Starter",
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
      "EPUB + PDF export — her kitap için",
      "Wizard ile hızlı outline: konu → yapı → bölümler",
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
      "Araştırma merkezi — KDP trend ve keyword analizi",
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
    description: "Tek bir kategoride değil, birden fazla nişte tam hızda çalış. Kapak fabrikası, seri üretim ve API ile kendi workflow'una entegre et.",
    features: [
      "Ayda 80 kitap üretimi — tam kapasite",
      "Ayda 200 kapak hakkı",
      "Tüm çıktı formatları: EPUB, PDF, HTML, Markdown",
      "Araştırma merkezi + gelişmiş KDP pazar analizi",
      "Seri ve tema bazlı toplu üretim",
      "Bölüm şablonları ve özelleştirilmiş ton profilleri",
      "API erişimi — kendi sistemlerine entegre et",
      "Öncelikli destek + özel onboarding",
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
        "Evet, tamamen ücretsiz. Kayıt veya kart bilgisi olmadan wizard'ı tamamlar, kapağını ve bölüm planını görürsün. İlk %20 içerik önizlemesi de dahil. Ödeme yalnızca tam kitabı ve export dosyalarını almak istediğinde gerekiyor.",
      ],
      [
        "AI ile üretilen içerik gerçekten kullanılabilir kalitede mi?",
        "Çıkan içerik yapılandırılmış bir taslak — profesyonel editör gibi değil, ama boş sayfayla başlamak yerine düzenlenmeye hazır bir iskelet. Her bölümü değiştirebilir, yeniden üretebilir veya kendi metninle değiştirebilirsin. Bu pipeline ile 2 kitap Amazon KDP'de yayında.",
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
        "Konu, hedef okur, ton ve dil gibi kısa bilgileri girersin. Sistem buna göre outline ve bölüm akışını kurar.",
      ],
      [
        "Taslağı onaylamadan bölüm üretmek zorunda mıyım?",
        "Hayır. Önce outline üzerinde karar verip sonra bölüm üretimine geçmen önerilir.",
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
        "Evet. Wizard'ı tamamen Türkçe doldurabilirsin; sistem içeriği seçtiğin dilde — İngilizce dahil — üretir. Ayrıca çeviri araç kullanmana gerek yok. Türkçe bilgini İngilizce KDP kitabına dönüştürmek bu ürünün en güçlü kullanım senaryolarından biri.",
      ],
      [
        "Kaç bölüm üretilir? Uzunluğu kontrol edebilir miyim?",
        "Outline aşamasında bölüm sayısını ve başlıklarını onaylarsın; sistem genelde 7–12 bölümlük taslak önerir. Bölümleri ekleyebilir, çıkarabilir veya yeniden sıralayabilirsin. Bölüm uzunluğu da ayarlanabilir bir parametre.",
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
        "Her kitap kendi klasöründe, zaman damgalı export klasörleri ile saklanır.",
      ],
      [
        "EPUB dosyasını direkt Amazon KDP'ye yükleyebilir miyim?",
        "Evet. Üretilen EPUB Amazon KDP'nin standart yükleme akışıyla uyumludur. Kapak ve metadata dahil olmak üzere bu pipeline ile 2 kitap KDP'de yayınlandı. Yayın öncesi kontrol listesi için blog bölümündeki KDP rehberine bakabilirsin.",
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
        "$29 tek seferlik ödeme ne kapsıyor?",
        "$29 Premium, aylık abonelik olmadan tek bir kitap için tam erişim: tüm bölümler, kapak, EPUB ve PDF export. Süre sınırı yok. Birden fazla kitap üretmek isteyenler aylık planları tercih edebilir, ama ilk kitabı denemek için en düşük giriş noktası bu.",
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
        "Önce brief ve taslağı gözden geçir. Gerekirse yeniden yazım, genişletme veya destek yönlendirmesiyle akışı düzelt.",
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
    slug: "ai-ile-yazilan-kitap-kime-aittir",
    title: "AI ile Yazılan Kitap Kime Aittir?",
    summary: "İçerik kontrolü, hak sahipliği ve kullanıcı sorumluluğunu sade biçimde açıklar.",
    category: "Haklar",
    readTime: "4 dk",
    intro: "İlk çekince genelde aynıdır: bu kitabın gerçekten sahibi ben olacak mıyım? Güven oluşturan cevap kısa, açık ve hukuki iddiaya kaçmadan verilmelidir.",
    sections: [
      ["Temel çerçeve", "Araç yazımı hızlandırır; konu, yön, kurgu ve son karar kullanıcıda olduğunda kitabın pratik kontrolü de kullanıcıda kalır."],
      ["Neden bu kadar önemli?", "İnsanlar teknik model detayından çok yayımlama özgürlüğünü ve emeğinin karşılığını bilmek ister."],
      ["Ürün içinde nasıl söylenmeli?", "Kısa ve net: Kitabın yönü, düzenlemesi ve son hali sende."],
    ],
  },
  {
    slug: "ilk-kitabimi-nasil-planlarim",
    title: "İlk Kitabımı Nasıl Planlarım?",
    summary: "İlk kez kitap üreten biri için en kısa planlama mantığını verir.",
    category: "Başlangıç",
    readTime: "5 dk",
    intro: "İlk kitapta sorun çoğu zaman yazmak değil, dağınık başlamaktır. Bu yüzden plan kısa ve net olmalıdır.",
    sections: [
      ["Tek sonuç seç", "Kitap bir ana dönüşüm sağlamalı. Her şeyi aynı anda anlatmaya çalışmamalı."],
      ["Tek okur tipi belirle", "Belirsiz kitle için yazılan kitaplar hızla genelleşir ve gücünü kaybeder."],
      ["Küçük omurga kur", "İlk sürüm için 5 ila 7 ana bölüm çoğu rehber kitapta yeterlidir."],
    ],
  },
  {
    slug: "epub-ve-pdf-farki",
    title: "EPUB ve PDF Farkı Nedir?",
    summary: "İlk kullanıcı için hangi formatın ne zaman doğru olduğunu açıklar.",
    category: "Yayın",
    readTime: "3 dk",
    intro: "Kullanıcı çoğu zaman iki formatı da ister ama neden önce EPUB önerildiğini bilmez.",
    sections: [
      ["EPUB ne için?", "Akışkan e-kitap formatıdır. Telefon, tablet ve e-kitap okuyucularda daha rahat çalışır."],
      ["PDF ne için?", "Sabit düzenli çıktıdır. Baskı veya sabit görünüm ihtiyacı olduğunda daha uygundur."],
      ["Önerilen sıra", "Önce EPUB üret. Yapıyı kontrol ettikten sonra PDF al."],
    ],
  },
  {
    slug: "kdpye-yuklemeden-once-ne-kontrol-etmeli",
    title: "KDP’ye Yüklemeden Önce Ne Kontrol Etmeli?",
    summary: "Yayın öncesi kısa ama pratik bir kontrol mantığı sunar.",
    category: "KDP",
    readTime: "4 dk",
    intro: "Yayın öncesi kontrol uzun rehber değil, anlaşılır bir son kontrol listesi olmalıdır.",
    sections: [
      ["Vaat net mi?", "Başlık, alt başlık ve açıklama kitabın ne sunduğunu ilk bakışta anlatmalıdır."],
      ["Akış temiz mi?", "Bölümler mantıklı sırada olmalı, tekrarlar ve yarım kalan başlıklar temizlenmelidir."],
      ["Kapak uyumlu mu?", "Kapak ile kitabın türü arasında görsel ve metinsel uyum olmalıdır."],
    ],
  },
  {
    slug: "yazmayi-bilmeden-kitap-cikarabilir-miyim",
    title: "Yazmayı Bilmeden Kitap Çıkarabilir miyim?",
    summary: "İlk kullanıcı korkusuna en basit yanıtı verir.",
    category: "Başlangıç",
    readTime: "4 dk",
    intro: "Kullanıcı çoğu zaman yetenek eksikliğinden değil, başlama baskısından takılır.",
    sections: [
      ["Evet, ama yön senden gelmeli", "Araç metni üretir; ne anlatacağını ve son halini sen belirlersin."],
      ["Neden sihirbaz akışı önemli?", "Çünkü ilk kullanıcı boş ekran değil, sorularla yönlendirilmiş ilerleme ister."],
      ["Asıl fark", "Mükemmel prompt değil, net amaç fark yaratır."],
    ],
  },
  {
    slug: "kitap-fikri-nasil-secilir",
    title: "Kitap Fikri Nasıl Seçilir?",
    summary: "Konu seçimini sadece ilhama değil, okur ve ihtiyaç eşleşmesine bağlar.",
    category: "Araştırma",
    readTime: "5 dk",
    intro: "İyi konu çoğu zaman en yaratıcı konu değil, en net okur ihtiyacına dokunan konudur.",
    sections: [
      ["Bildiğin şeyi seç", "Uzmanlık veya deneyim temeli olmayan konu, içerik derinliğini hızla düşürür."],
      ["Sorun odaklı düşün", "İnsanlar sonuç vaat eden kitaplara daha hızlı bağ kurar."],
      ["Araştırmayla doğrula", "KDP ve anahtar kelime verisi, sezgiyi gerçek taleple karşılaştırır."],
    ],
  },
  {
    slug: "ingilizce-kitap-icin-nasil-brief-verilir",
    title: "İngilizce Kitap İçin Nasıl Brief Verilir?",
    summary: "Türkçe arayüzden İngilizce kitap üretirken daha iyi sonuç almanın kısa yolunu gösterir.",
    category: "Prompting",
    readTime: "4 dk",
    intro: "Dil English olsa bile brief ne kadar netse çıktı da o kadar doğal ve düzenli olur.",
    sections: [
      ["Okur tipini belirt", "English içerikte kime yazıldığını söylemek ton ve kelime seçiminde çok fark yaratır."],
      ["Stil cümlesi ekle", "Clear, practical, example-driven gibi kısa stil tanımları sonucu iyileştirir."],
      ["Bölüm derinliğini baştan ver", "Kısa rehber mi, daha kapsamlı bir playbook mu istediğini en başta söyle."],
    ],
  },
  {
    slug: "ilk-kitabim-kac-bolum-olmali",
    title: "İlk Kitabım Kaç Bölüm Olmalı?",
    summary: "İlk kitapta fazla bölüm açmanın neden çoğu zaman hata olduğunu açıklar.",
    category: "Yapı",
    readTime: "3 dk",
    intro: "Bölüm sayısı arttıkça kalite artmaz; çoğu zaman odak dağılır.",
    sections: [
      ["Başlangıç için ideal aralık", "Çoğu bilgi kitabı için 5 ila 7 bölüm oldukça yeterlidir."],
      ["Ne zaman daha fazla?", "Geniş örnek, vaka veya alt konu yoğunluğu varsa bölüm sayısı yükseltilebilir."],
      ["Neden küçük başlamak daha iyi?", "Daha temiz bir akış, daha kolay düzenleme ve daha hızlı ilk çıktı sağlar."],
    ],
  },
  {
    slug: "ai-taslagi-nasil-duzeltilir",
    title: "AI Taslağı Nasıl Düzeltilir?",
    summary: "Ham taslağı daha güvenli ve daha insani hale getirmek için kısa düzenleme yöntemi sunar.",
    category: "Düzenleme",
    readTime: "4 dk",
    intro: "İyi sonuç sadece üretmek değil, taslağı güçlendirmekle gelir.",
    sections: [
      ["Önce yapı", "Başlık sırası ve bölüm akışı oturmadan cümle düzeltmek verimsizdir."],
      ["Sonra tekrarlar", "Aynı fikir farklı cümlelerle birden fazla yerde geçiyorsa sadeleştir."],
      ["En son ses", "Kendi tonunu ekle, örneklerini ve cümle ritmini kişiselleştir."],
    ],
  },
  {
    slug: "kapak-secerken-en-onemli-5-sey",
    title: "Kapak Seçerken En Önemli 5 Şey",
    summary: "Kapak kararını estetik yerine işlev odaklı vermeye yardımcı olur.",
    category: "Kapak",
    readTime: "4 dk",
    intro: "Kapak sadece güzel görünmek için değil, doğru kitabı doğru okura anlatmak için vardır.",
    sections: [
      ["Türü hemen anlatmalı", "Kapak kitabın rehber, iş, eğitim veya hikâye olduğunu ilk bakışta hissettirmeli."],
      ["Başlık okunmalı", "Küçük önizlemede bile başlık mümkün olduğunca rahat seçilmelidir."],
      ["Aşırı karmaşadan kaçın", "Bir ana fikir, bir ana görsel, net tipografi daha iyi çalışır."],
    ],
  },
] as const;
