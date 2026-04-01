"use client";

import {
  FloatingIconsHero,
  type FloatingIconsHeroProps,
} from "@/components/ui/floating-icons-hero-section";

const heroCoverBlueprint: FloatingIconsHeroProps["assets"] = [
  {
    id: 1,
    className: "left-[8%] top-[14%]",
    cover: { title: "Atomic Habits", author: "J. Clear", badge: "KDP", palette: ["#1f2937", "#111827"] },
  },
  {
    id: 2,
    className: "right-[10%] top-[14%]",
    cover: { title: "Deep Work", author: "C. Newport", badge: "PLAY", palette: ["#075985", "#0f766e"] },
  },
  {
    id: 3,
    className: "left-[12%] top-[54%]",
    cover: { title: "The Lean Startup", author: "E. Ries", badge: "APPLE", palette: ["#312e81", "#4338ca"] },
  },
  {
    id: 4,
    className: "right-[14%] top-[56%]",
    cover: { title: "Start With Why", author: "S. Sinek", badge: "KOBO", palette: ["#881337", "#be123c"] },
  },
  {
    id: 5,
    className: "left-[18%] top-[76%]",
    cover: { title: "Influence", author: "R. Cialdini", badge: "KDP", palette: ["#7c2d12", "#c2410c"] },
  },
  {
    id: 6,
    className: "right-[20%] top-[78%]",
    cover: { title: "Hooked", author: "N. Eyal", badge: "PLAY", palette: ["#14532d", "#15803d"] },
  },
  {
    id: 7,
    className: "left-[28%] top-[18%]",
    cover: { title: "Company of One", author: "P. Jarvis", badge: "APPLE", palette: ["#0f172a", "#334155"] },
  },
  {
    id: 8,
    className: "right-[30%] top-[22%]",
    cover: { title: "Rework", author: "37signals", badge: "KOBO", palette: ["#292524", "#57534e"] },
  },
  {
    id: 9,
    className: "left-[30%] top-[68%]",
    cover: { title: "4-Hour Workweek", author: "T. Ferriss", badge: "KDP", palette: ["#9f1239", "#be185d"] },
  },
  {
    id: 10,
    className: "right-[32%] top-[68%]",
    cover: { title: "Traction", author: "G. Weinberg", badge: "PLAY", palette: ["#172554", "#1d4ed8"] },
  },
  {
    id: 11,
    className: "left-[42%] top-[10%]",
    cover: { title: "Blue Ocean", author: "W. Kim", badge: "APPLE", palette: ["#0c4a6e", "#0369a1"] },
  },
  {
    id: 12,
    className: "right-[42%] top-[10%]",
    cover: { title: "Thinking Fast", author: "D. Kahneman", badge: "KOBO", palette: ["#365314", "#65a30d"] },
  },
  {
    id: 13,
    className: "left-[42%] top-[82%]",
    cover: { title: "Show Your Work", author: "A. Kleon", badge: "KDP", palette: ["#7f1d1d", "#b91c1c"] },
  },
  {
    id: 14,
    className: "right-[42%] top-[82%]",
    cover: { title: "Make Time", author: "J. Knapp", badge: "PLAY", palette: ["#713f12", "#ca8a04"] },
  },
];

const internetCoverPool = [
  "https://covers.openlibrary.org/b/isbn/0735211299-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1455586692-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0307887898-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1591846447-L.jpg",
  "https://covers.openlibrary.org/b/isbn/006124189X-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1591847788-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1328972356-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0307463745-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0307465357-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1593273886-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1591396190-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0374533555-L.jpg",
  "https://covers.openlibrary.org/b/isbn/076117897X-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0525572422-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0062315005-L.jpg",
  "https://covers.openlibrary.org/b/isbn/1594484805-L.jpg",
  "https://covers.openlibrary.org/b/isbn/006245773X-L.jpg",
  "https://covers.openlibrary.org/b/isbn/0553380168-L.jpg",
];

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

const shuffledPool = shuffled(internetCoverPool);

const heroCovers: FloatingIconsHeroProps["assets"] = heroCoverBlueprint.map((item, index) => {
  if (!("cover" in item)) return item;
  return {
    ...item,
    cover: {
      ...item.cover,
      imageUrl: shuffledPool[index % shuffledPool.length],
    },
  };
});

export function HomeFloatingIconsHero() {
  return (
    <FloatingIconsHero
      className="border-b border-border/80"
      badge="AI Destekli Kitap Yazma"
      title="Uzmanlığını kitaba çevir. İlk EPUB'ını bu hafta al."
      subtitle="Danışmanlar, eğitmenler ve creator'lar için: Brief gir, outline onayla, bölümleri üret, kapağı ekle — yayın dosyan hazır."
      ctaText="İlk kitabını başlat"
      ctaHref="/start/topic"
      secondaryCtaText="Ornek ciktilari gor"
      secondaryCtaHref="/examples"
      trustNote="Kredi kartı gerekmez · 14 gün ücretsiz · İstediğin zaman iptal · 30 gün iade garantisi"
      socialProof={{ count: "1.240+", rating: "4.9/5" }}
      assets={heroCovers}
    />
  );
}
