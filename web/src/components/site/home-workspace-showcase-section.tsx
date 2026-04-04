"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookCopy,
  Clock,
  FileSearch,
  ImagePlus,
  Layers3,
  Target,
  WandSparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSeededSiteBooks,
  siteExamplePublicCoverUrl,
} from "@/lib/site-real-books";
import { KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const workspacePoints = [
  {
    icon: Target,
    title: "Konu kararından bölüm planına dakikalar içinde",
    description: "Başlık, alt başlık ve bölüm sırası aynı ekranda toplanır. Boş sayfada bekleme yok.",
  },
  {
    icon: Zap,
    title: "Araştırma, bölüm planını doğrudan besler",
    description: "KDP skoru ve anahtar kelime önerileri bölüm planıyla aynı ekranda görünür — hangi konunun satacağını daha kitap yazılmadan anlarsın.",
  },
  {
    icon: Clock,
    title: "İlk taslaktan yayın dosyasına tek çalışma alanı",
    description: "Kapak, çıktı ve kitap bilgileri kitap bazında organize edilir; başka panel gerekmez.",
  },
] as const;

const workspaceAssetBooks = getSeededSiteBooks("home-workspace-cover-scene", 3);

export function HomeWorkspaceShowcaseSection() {
  return (
    <section className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(233,230,220,0.3),transparent_35%,transparent)] py-20 md:py-24">
      <div className="shell grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary/80">
            Çalışma alanı
          </div>
          <h2 className="mt-5 max-w-xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Proje panosu: tüm kitapların tek ekranda.
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-base leading-8 text-muted-foreground md:text-lg">
            Aktif bölümler, tamamlananlar, çıktı geçmişi ve bir sonraki adım: dağınık dosyalar yerine tek bakışta durumu görürsün.
          </p>

          <div className="mt-8 space-y-4">
            {workspacePoints.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-border/80 bg-card/80 px-4 py-4 shadow-sm"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-accent text-primary">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="/start/topic">İlk kitabını başlat</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/how-it-works">Nasıl çalıştığını gör</a>
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground/70">
            Kredi kartı gerekmez · Önce önizleme gör, sonra karar ver · {NO_API_COST_CLAIM} · {KDP_GUARANTEE_CLAIM}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute inset-x-10 top-6 h-56 rounded-full bg-[radial-gradient(circle,rgba(201,100,66,0.18),transparent_72%)] blur-3xl" />

          <div className="relative rounded-[36px] border border-border/80 bg-card/90 p-4 shadow-[0_18px_60px_-28px_rgba(61,57,41,0.28)] backdrop-blur-sm md:p-6">
            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[30px] border border-border/80 bg-background/90 p-5">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Layers3 className="size-4 text-primary" />
                    Kitap çalışma alanı
                  </div>
                  <div className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                    örnek-kitap
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-3">
                    {[
                      "Başlık ve alt başlık",
                      "Kitap açıklaması",
                      "Bölüm planı düzenleme",
                      "Bölüm sırası",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-2xl border px-4 py-3 text-sm ${
                          index === 0
                            ? "border-primary/20 bg-accent/80 text-foreground"
                            : "border-border/80 bg-card text-muted-foreground"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-border/80 bg-card p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <WandSparkles className="size-4 text-primary" />
                      İçerik üretimi
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        "Açılış bölümü problemi net koyar.",
                        "İkinci bölüm okura uygulanabilir bir sistem verir.",
                        "Son bölüm EPUB çıkışına kadar yönlendirir.",
                      ].map((line) => (
                        <div
                          key={line}
                          className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-xs leading-6 text-foreground"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,rgba(201,100,66,0.08),transparent_70%)] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileSearch className="size-4 text-primary" />
                    Araştırma paneli
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["KDP puanı", "Anahtar kelime", "Konu uyumu", "Düşük rekabet"].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/80 bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ImagePlus className="size-4 text-primary" />
                    Kapak ve varlıklar
                  </div>
                  <div className="mt-4 flex items-end justify-center gap-3 rounded-[24px] border border-border/70 bg-background px-4 py-5">
                    {workspaceAssetBooks.map((book, index) => (
                      <motion.div
                        key={book.slug}
                        animate={{ y: [0, index === 1 ? -4 : 4, 0] }}
                        transition={{ duration: 4.5 + index, repeat: Infinity, ease: "easeInOut" }}
                        className={`relative overflow-hidden rounded-[18px] border border-black/10 bg-stone-950 shadow-lg ${
                          index === 1 ? "h-36 w-24" : "h-28 w-20"
                        }`}
                      >
                        <Image
                          src={siteExamplePublicCoverUrl(book.slug)}
                          alt={`${book.title} kapağı`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_20%,transparent_80%,rgba(0,0,0,0.12))]" />
                        <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/18 bg-black/40 px-2 py-1 text-[10px] font-medium tracking-[0.16em] text-white backdrop-blur-sm">
                          {index === 1 ? "Öne çıkan" : "Kapak"}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/80 bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BookCopy className="size-4 text-primary" />
                    Yayın çıkışı
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["EPUB", "Hazır"],
                      ["PDF", "Sırada"],
                    ].map(([name, state]) => (
                      <div key={name} className="rounded-2xl border border-border/70 bg-background px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{name}</div>
                        <div className="mt-1 text-sm font-medium text-foreground">{state}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
