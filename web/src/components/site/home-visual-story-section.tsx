"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BookOpenText,
  CheckCircle2,
  FileOutput,
  ImagePlus,
  Languages,
  LayoutTemplate,
  SearchCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const storySteps = [
  {
    step: "1",
    badge: "Konu Özeti",
    title: "Fikrini gir. Sistem kitap yönünü kursun.",
    description:
      "Kitap türü, konu, hedef okur ve dil tercihini yaz. Sistem başlık, alt başlık ve ilk omurgayı tek ekranda önerir.",
    bullets: ["Türkçe arayüz", "İngilizce çıktı", "Başlık + açıklama"],
    mock: "brief",
  },
  {
    step: "2",
    badge: "Bölüm Planı",
    title: "Taslağı gör. Bölüm sırasını netleştir.",
    description:
      "Daha yazıya geçmeden önce bölüm akışını, okuyucu vaadini ve araştırma sinyallerini aynı yerde kontrol et.",
    bullets: ["Bölüm yapısı", "Anahtar kelime yönü", "Düzenlenebilir taslak"],
    mock: "outline",
  },
  {
    step: "3",
    badge: "Yayın",
    title: "İçeriği üret. Kapağı ekle. EPUB al.",
    description:
      "Bölümler sırayla oluşur, kapak akışı eklenir ve yayın klasörüne ilk teslim dosyaların düşer.",
    bullets: ["Kapak akışı", "EPUB + PDF", "Çıktı klasörü"],
    mock: "publish",
  },
] as const;

function MockFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-border/80 bg-card/85 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/85" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/45" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/25" />
        </div>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

function BriefMock() {
  return (
    <MockFrame title="Yeni kitap">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {[
            ["Kitap türü", "Pratik rehber"],
            ["Konu", "E-mail ile danışmanlık satmak"],
            ["Hedef okur", "Freelance tasarımcılar"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border/80 bg-background/90 px-4 py-3"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {["İngilizce", "6 bölüm", "Kısa tanıtım kitabı değil"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-accent/60 px-3 py-1 text-xs text-accent-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_72%)] p-5"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
            <Sparkles className="size-4" />
            AI önerisi
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Inbox to Income
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            E-mail üzerinden uzmanlığını nasıl konumlandıracağını gösteren, sade ve satışa dönük bir rehber.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              "Başlık + alt başlık",
              "Kitap açıklaması",
              "İlk bölüm planı",
              "Bölüm sırası",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-xs text-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MockFrame>
  );
}

function OutlineMock() {
  return (
      <MockFrame title="Bölüm planı + araştırma">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-2">
          {[
            "01. Problem ve vaat",
            "02. Konumlandırma",
            "03. Teklif yapısı",
            "04. Örnek akış",
            "05. İtirazlar",
            "06. Sonraki adım",
          ].map((chapter, index) => (
            <div
              key={chapter}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                index === 1
                  ? "border-primary/35 bg-accent/80 text-foreground"
                  : "border-border/80 bg-background/90 text-muted-foreground",
              )}
            >
              {chapter}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-border/80 bg-background/95 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpenText className="size-4 text-primary" />
              Bölüm 2: Konumlandırma
            </div>
            <div className="mt-4 space-y-2">
              {[
                "Kim için yazıldığı ilk sayfada netleşir.",
                "Hızlı sonuç vaadi tek cümlede kurulur.",
                "Teklif öncesi güven inşa eden bölüm iskeleti hazırlanır.",
              ].map((line) => (
                <div
                  key={line}
                  className="rounded-2xl border border-border/70 bg-card/80 px-3 py-3 text-xs leading-6 text-foreground"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <SearchCheck className="size-4 text-primary" />
                Anahtar kelime yönü
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["email sales", "consulting offer", "client system"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Languages className="size-4 text-primary" />
                Çıktı dili
              </div>
              <div className="mt-3 text-xs leading-6 text-muted-foreground">
                Panel Türkçe kalır. Kitap içeriği İngilizce olarak ilerler.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function PublishMock() {
  return (
    <MockFrame title="Yayına Hazırla">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex items-end justify-center gap-3 rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_80%)] px-4 py-6">
          {[
            ["Üretim Özeti", "amber", "KDP"],
            ["E-posta İçin Kitap", "zinc", "EPUB"],
            ["Yayın Notları", "orange", "PDF"],
          ].map(([title, tone, badge], index) => (
            <motion.div
              key={title}
              animate={{ y: [0, index === 1 ? -4 : 4, 0] }}
              transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "flex h-44 w-28 flex-col justify-between rounded-t-[30px] px-4 py-4 text-white shadow-xl",
                tone === "amber" && "bg-[linear-gradient(180deg,#f5b24c,#d97706)]",
                tone === "zinc" && "h-52 bg-[linear-gradient(180deg,#52525b,#18181b)]",
                tone === "orange" && "bg-[linear-gradient(180deg,#fb923c,#ea580c)]",
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">{badge}</div>
              <div className="text-sm font-semibold leading-5">{title}</div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/80 bg-background/95 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileOutput className="size-4 text-primary" />
              Çıktı durumu
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["EPUB", "Hazır"],
                ["PDF", "Sırada"],
                ["Kapak dosyaları", "Hazır"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                  <span className="text-sm text-foreground">{label}</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ImagePlus className="size-4 text-primary" />
                Kapak akışı
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Ön kapak, arka kapak ve çıktı klasörü tek kitap altında toplanır.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LayoutTemplate className="size-4 text-primary" />
                Teslim dosyaları
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Zaman damgalı klasör ile hangi çıktının ne zaman alındığı nettir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function renderMock(mock: (typeof storySteps)[number]["mock"]) {
  if (mock === "brief") return <BriefMock />;
  if (mock === "outline") return <OutlineMock />;
  return <PublishMock />;
}

export function HomeVisualStorySection() {
  return (
    <section className="border-b border-border/80 py-20 md:py-24">
      <div className="shell">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>3 adım</Badge>
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Fikrini yaz. Taslağı gör. Kitabını yayımla.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            Buradaki amaç çok ekran göstermek değil. Doğru sırayı göstermek. Kullanıcı ne zaman ne yapacağını tek bakışta anlar.
          </p>
        </div>

        <div className="mt-12 space-y-8 md:space-y-10">
          {storySteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "grid items-center gap-6 rounded-[36px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--primary)_2%,var(--card)))] p-5 shadow-sm md:p-7 lg:grid-cols-[0.8fr_1.2fr]",
                index % 2 === 1 && "lg:grid-cols-[1.2fr_0.8fr]",
              )}
            >
              <div className={cn("space-y-5", index % 2 === 1 && "lg:order-2")}>
                <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-accent text-primary">
                    {item.step}
                  </span>
                  {item.badge}
                </div>

                <div>
                  <h3 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.bullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              </div>

              <div className={cn(index % 2 === 1 && "lg:order-1")}>{renderMock(item.mock)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
