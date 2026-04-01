"use client";

import { Badge } from "@/components/ui/badge";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";

const galleryItems: GalleryItem[] = [
  {
    title: "Prompt Systems",
    author: "Maya Brooks",
    subtitle: "team handbook",
    cover: {
      label: "AI Guide",
      stamp: "Edition 01",
      gradient: "linear-gradient(180deg, #f59e0b 0%, #d97706 36%, #78350f 100%)",
    },
  },
  {
    title: "Quiet Expertise",
    author: "Daniel Reed",
    subtitle: "authority book",
    cover: {
      label: "Nonfiction",
      stamp: "English",
      gradient: "linear-gradient(180deg, #1f2937 0%, #111827 42%, #0f172a 100%)",
    },
  },
  {
    title: "Creator Course",
    author: "Selin Kaya",
    subtitle: "launch playbook",
    cover: {
      label: "Creator",
      stamp: "Volume A",
      gradient: "linear-gradient(180deg, #ef4444 0%, #b91c1c 42%, #450a0a 100%)",
    },
  },
  {
    title: "Startup Ops",
    author: "Noah Ellis",
    subtitle: "practical guide",
    cover: {
      label: "Business",
      stamp: "Field Notes",
      gradient: "linear-gradient(180deg, #0f766e 0%, #115e59 40%, #042f2e 100%)",
    },
  },
  {
    title: "Teach What You Know",
    author: "Ece Demir",
    subtitle: "learning design",
    cover: {
      label: "Education",
      stamp: "Series 04",
      gradient: "linear-gradient(180deg, #2563eb 0%, #1d4ed8 40%, #172554 100%)",
    },
  },
  {
    title: "Market Angles",
    author: "Liam Hart",
    subtitle: "research notes",
    cover: {
      label: "Research",
      stamp: "Signal",
      gradient: "linear-gradient(180deg, #4b5563 0%, #374151 42%, #111827 100%)",
    },
  },
  {
    title: "Write to Convert",
    author: "Ava Stone",
    subtitle: "message clarity",
    cover: {
      label: "Copy",
      stamp: "Creator 07",
      gradient: "linear-gradient(180deg, #7c3aed 0%, #6d28d9 44%, #2e1065 100%)",
    },
  },
  {
    title: "Small Team Automation",
    author: "Arda Yılmaz",
    subtitle: "workflow book",
    cover: {
      label: "Systems",
      stamp: "Playbook",
      gradient: "linear-gradient(180deg, #059669 0%, #047857 42%, #052e16 100%)",
    },
  },
];

export function HomeBookGallerySection() {
  return (
    <section className="border-b border-border/80 py-20">
      <div className="shell">
        <div className="mx-auto max-w-2xl text-center">
          <Badge>Kitap vitrini</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Burada kitap fikirleri değil, doğrudan kitap yönleri dönüyor.
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            Başlık, ton ve yazar konumlandırmasını tek bakışta gör. Aynı sistem bu tip kitapları içeride üretmek için var.
          </p>
        </div>

        <div className="mt-10 h-[560px] overflow-hidden rounded-[32px] border border-border bg-card/75 md:h-[660px] lg:h-[760px]">
          <CircularGallery items={galleryItems} className="h-full" />
        </div>
      </div>
    </section>
  );
}
