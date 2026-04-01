"use client";

import {
  TestimonialsColumnsSection,
  type TestimonialItem,
} from "@/components/ui/testimonials-columns-1";

const testimonials: TestimonialItem[] = [
  {
    text: "İlk rehber kitabımı iki akşamda çıkardım. Baskı ve tasarım maliyeti toplamda beklediğimden çok daha düşük kaldı, şimdi düşük fiyatlı giriş ürünü olarak satıyorum.",
    name: "Selin A.",
    role: "Eğitmen",
    platform: "KDP",
  },
  {
    text: "Ajans teklifine göre çok daha ucuza mal oldu. Başlık, bölüm planı ve EPUB çıktısı tek yerden geldiği için ilk satış sayfamı haftalar değil günler içinde açtım.",
    name: "Baran K.",
    role: "Danışman",
    platform: "Gumroad",
  },
  {
    text: "Uzmanlık notlarımı düzenli bir kitaba çevirdim. Şimdi bunu ana hizmetime giriş ürünü olarak kullanıyorum ve yeni müşterilerle ilk teması daha kolay kuruyorum.",
    name: "Merve D.",
    role: "Koç",
    platform: "Kendi sitesi",
  },
  {
    text: "Daha önce kitap çıkarmayı sürekli erteliyordum. Burada adımlar net olduğu için ilk dijital kitabımı bitirdim ve kendi topluluğuma satmaya başladım.",
    name: "Emir T.",
    role: "Creator",
    platform: "Lemon Squeezy",
  },
  {
    text: "En sevdiğim taraf maliyet kontrolü oldu. Her şeyi dışarı vermek yerine içerde net bir akışla ilerledim; zaman da para da ciddi şekilde korundu.",
    name: "Gizem Y.",
    role: "Uzman Eğitmen",
    platform: "KDP",
  },
  {
    text: "Konu araştırması ve bölüm üretimi birleşince elimde satılabilir bir mini kitap oluştu. Şimdi lead magnet değil, direkt ücretli ürün olarak konumluyorum.",
    name: "Onur B.",
    role: "Growth Danışmanı",
    platform: "Gumroad",
  },
  {
    text: "Kendi küçük bilgi ürünümü çıkarmak için karmaşık yazılım aramıyordum. Burada ilk taslaktan kapağa kadar yol net olduğu için işi gerçekten bitirdim.",
    name: "Aslı N.",
    role: "Freelancer",
    platform: "Kendi sitesi",
  },
  {
    text: "İlk kitap denememde en büyük sorun nereden başlayacağımı bilmemekti. Bu arayüzle kitabı kurdum, fiyatlandırdım ve satış testine soktum.",
    name: "Kerem S.",
    role: "Solo Founder",
    platform: "KDP",
  },
  {
    text: "Kısa, net ve üretime dönük. Çok büyük yatırım yapmadan ilk bilgi ürünümü çıkarmamı sağladı. Şimdi aynı sistemi ikinci kitap için de kullanıyorum.",
    name: "Derya E.",
    role: "Topluluk Kurucusu",
    platform: "Apple Books",
  },
];

export function HomeTestimonialsSection() {
  return (
    <TestimonialsColumnsSection
      badge="Kullanıcı yorumları"
      title="İlk kitabını çıkarıp satışa koyanlar ne diyor?"
      description="Söz aynı yerde birleşiyor: süreç net olduğunda ilk bilgi ürününü çıkarmak daha hızlı ve daha kontrollü maliyetle mümkün oluyor."
      testimonials={testimonials}
    />
  );
}
