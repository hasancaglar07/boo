"use client";

import { Badge } from "@/components/ui/badge";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";
import { SITE_REAL_BOOKS, siteExamplePublicCoverUrl } from "@/lib/site-real-books";

const galleryItems: GalleryItem[] = SITE_REAL_BOOKS.slice(0, 8).map((book) => ({
  title: book.title,
  author: book.author,
  subtitle: book.category,
  cover: {
    label: book.language,
    stamp: book.category,
    imageUrl: siteExamplePublicCoverUrl(book.slug),
    gradient: `linear-gradient(180deg, ${book.palette[0]} 0%, ${book.palette[1]} 44%, ${book.palette[2]} 100%)`,
    textColor: "#ffffff",
  },
}));

export function HomeBookGallerySection() {
  return (
    <section className="border-b border-border/80 py-20">
      <div className="shell">
        <div className="mx-auto max-w-2xl text-center">
          <Badge>Gerçek kitap vitrini</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Fikir mockup’ı değil, üretilmiş gerçek kapaklar dönüyor.
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            Buradaki tüm kitaplar gerçek example output’larından geliyor. Aynı kapak hattı, aynı export zinciri ve aynı kitap üretim akışı site içinde tekrar kullanılıyor.
          </p>
        </div>

        <div className="mt-10 h-[560px] overflow-hidden rounded-[32px] border border-border bg-card/75 md:h-[660px] lg:h-[760px]">
          <CircularGallery items={galleryItems} className="h-full" />
        </div>
      </div>
    </section>
  );
}
