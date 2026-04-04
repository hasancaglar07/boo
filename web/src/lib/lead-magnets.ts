export type LeadMagnetSlug = "ai-book-starter-pack";

export type LeadMagnetDeliverySection = {
  title: string;
  items: string[];
  ordered?: boolean;
};

export type LeadMagnetDefinition = {
  slug: LeadMagnetSlug;
  badge: string;
  title: string;
  description: string;
  formTitle: string;
  formDescription: string;
  previewHighlights: string[];
  trustPoints: string[];
  successTitle: string;
  successDescription: string;
  instantAccessItems: string[];
  deliverySections: LeadMagnetDeliverySection[];
  nextStepHref: string;
  nextStepLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
};

export const leadMagnetCatalog: LeadMagnetDefinition[] = [
  {
    slug: "ai-book-starter-pack",
    badge: "Email Starter Pack",
    title: "AI ile Kitap Yazma Başlangıç Paketi",
    description:
      "Boş sayfaya düşmeden ilk kitabını çıkarmak için kısa rehber, kontrol listesi ve yön verici linkleri tek pakette toplar. Hedefi teori değil; seni doğrudan wizard ve preview akışına taşımaktır.",
    formTitle: "Paketi email ile al",
    formDescription:
      "Anında bu sayfada açılır, kopyası gelen kutuna düşer. Yalnız e-posta ister; başka alan yok.",
    previewHighlights: [
      "Konu özetini doldururken kullanacağın net çerçeve",
      "Outline onayında atlanmaması gereken 7 kontrol noktası",
      "EPUB ve PDF teslim öncesi hızlı hata avı listesi",
      "KDP'ye yüklemeden önce son kontrol notları",
      "Doğrudan ilgili tool ve wizard linkleri",
    ],
    trustPoints: [
      "Email only, düşük sürtünme",
      "Anında erişim + e-posta kopyası",
      "Okuduktan sonra direkt start funnel'a bağlanır",
    ],
    successTitle: "Paket gönderildi. Beklerken hızlı erişim burada.",
    successDescription:
      "Aynı içerik birazdan emailinde olacak. İstersen hemen aşağıdaki hızlı adımlarla kendi kitabını başlatabilirsin.",
    instantAccessItems: [
      "Konunu tek bir sonuç ve tek bir okur tipi etrafında daralt.",
      "Outline'ta her bölümün bir karar veya dönüşüm taşıdığını kontrol et.",
      "İlk preview'i görmeden ücretli adıma geçme.",
      "Export öncesi kapak, metadata ve EPUB akışını birlikte kontrol et.",
    ],
    deliverySections: [
      {
        title: "Paketin içinde ne var?",
        items: [
          "Konu özeti için doldur-boşalt briefing çerçevesi",
          "İlk outline için kısa kalite filtresi",
          "EPUB/PDF teslim zincirinde hata çıkaran noktalar",
          "Yayın öncesi metadata ve kapak kontrol notları",
        ],
      },
      {
        title: "10 dakikalık uygulama sırası",
        ordered: true,
        items: [
          "Konunu ve hedef okuru tek cümlede netleştir.",
          "Wizard'da topic adımını bu netlikle doldur.",
          "Outline çıktısını paket içindeki filtreyle kontrol et.",
          "Preview'i aç, sonra tam kitabı ilerletmeye karar ver.",
        ],
      },
      {
        title: "Bu paket en çok kime yarar?",
        items: [
          "İlk kez bilgi kitabı veya rehber çıkaracak uzmanlara",
          "Lead magnet kitap yazmak isteyen danışman ve eğitmenlere",
          "KDP için deneme kitabını hızlıca test etmek isteyen üreticilere",
        ],
      },
    ],
    nextStepHref: "/start/topic",
    nextStepLabel: "Ücretsiz Önizlemeyi Başlat",
    secondaryCtaHref: "/tools",
    secondaryCtaLabel: "Tool Hub'ı Aç",
  },
];

export const featuredLeadMagnet = leadMagnetCatalog[0];

export function getLeadMagnetBySlug(slug: string) {
  return leadMagnetCatalog.find((item) => item.slug === slug) || null;
}
