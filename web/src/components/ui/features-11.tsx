import type { ReactNode } from "react";
import { ArrowUpRight, BookOpenText, FileArchive, SearchCode, SquareStack } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeatureVisual = "editor" | "library" | "outline" | "exports";

export interface Features11Card {
  title: string;
  description: string;
  eyebrow?: string;
  visual: FeatureVisual;
}

export interface Features11Props {
  badge?: string;
  title?: string;
  description?: string;
  cards: readonly Features11Card[];
  className?: string;
}

function MockWindow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-border bg-background shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary/80" />
        <span className="h-2 w-2 rounded-full bg-primary/45" />
        <span className="h-2 w-2 rounded-full bg-primary/25" />
        <span className="ml-2 font-medium text-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function renderVisual(visual: FeatureVisual) {
  if (visual === "editor") {
    return (
      <MockWindow title="Chapter Plan + Outline">
        <div className="space-y-3">
          {[
            ["01", "Okur vaadi", "Belirli bir okur için net sonuç."],
            ["02", "Bölüm yapısı", "Örneklerle güçlenmiş altı temiz bölüm."],
            ["03", "Çıktıya hazır", "Ön sayfalar, kapak ve EPUB akışı."],
          ].map(([label, title, text]) => (
            <div key={title} className="rounded-2xl border border-border/80 bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-primary">{label}</span>
                <div className="text-sm font-medium text-foreground">{title}</div>
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </MockWindow>
    );
  }

  if (visual === "library") {
    return (
      <div className="relative flex h-full items-end justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent)] px-4 pb-3 pt-8">
        {[
          ["Komut Sistemleri", "amber", "Maya Brooks"],
          ["Araştırma Notları", "zinc", "David Hale"],
          ["Yayına Giden Yol", "orange", "Ayla Kent"],
        ].map(([title, tone, author], index) => (
          <div
            key={title}
            className={cn(
              "flex h-44 w-28 flex-col justify-between rounded-t-[28px] px-4 py-5 text-white shadow-xl",
              tone === "amber" && "bg-[linear-gradient(180deg,#f9b24c,#d97706)]",
              tone === "zinc" && "bg-[linear-gradient(180deg,#52525b,#18181b)]",
              tone === "orange" && "bg-[linear-gradient(180deg,#fb923c,#ea580c)]",
              index === 0 && "translate-y-5 rotate-[-8deg]",
              index === 1 && "z-10 -mx-3 h-52",
              index === 2 && "translate-y-6 rotate-[8deg]",
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">Book</div>
            <div>
              <div className="text-sm font-semibold leading-5">{title}</div>
              <div className="mt-2 text-xs text-white/70">{author}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "outline") {
    return (
      <MockWindow title="Araştırma + Konumlama">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <SearchCode className="size-4 text-primary" />
              Anahtar kelime kümeleri
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Okur derdi", "Düşük rekabet", "KDP uyumu", "Hızlı vaat"].map((chip) => (
                <span key={chip} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpenText className="size-4 text-primary" />
              Book plan
            </div>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <div className="rounded-xl bg-background px-3 py-2">Okuru ilk anda yakala</div>
              <div className="rounded-xl bg-background px-3 py-2">Sistemi net biçimde göster</div>
              <div className="rounded-xl bg-background px-3 py-2">Son çıktıyı yayına hazırla</div>
            </div>
          </div>
        </div>
      </MockWindow>
    );
  }

  return (
    <MockWindow title="Çıktı Akışı">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["EPUB", "Ana teslim biçimi"],
          ["PDF", "Sabit yerleşim"],
          ["Book details", "Author, ISBN, publisher"],
          ["Arşiv", "Zaman damgalı çıktı klasörü"],
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-border/80 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {title === "Arşiv" ? (
                <FileArchive className="size-4 text-primary" />
              ) : title === "Kitap bilgileri" ? (
                <SquareStack className="size-4 text-primary" />
              ) : (
                <ArrowUpRight className="size-4 text-primary" />
              )}
              {title}
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

export function Features11({
  badge,
  title = "Tek bir bölüm değil, birbirine bağlı bir üretim sistemi.",
  description = "Book production, research, editing, and export work like a single control pipeline.",
  cards,
  className,
}: Features11Props) {
  const [first, second, third, fourth] = cards;

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="shell">
        <div className="mx-auto max-w-3xl text-center">
          {badge ? <Badge>{badge}</Badge> : null}
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mx-auto mt-10 grid gap-4 sm:grid-cols-5">
          {first ? (
            <Card className="group overflow-hidden shadow-black/5 sm:col-span-3">
              <CardHeader className="p-6 md:p-8">
                {first.eyebrow ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">{first.eyebrow}</div> : null}
                <p className="text-2xl font-semibold text-foreground">{first.title}</p>
                <p className="max-w-sm text-sm leading-7 text-muted-foreground">{first.description}</p>
              </CardHeader>
              <CardContent className="pt-0">{renderVisual(first.visual)}</CardContent>
            </Card>
          ) : null}

          {second ? (
            <Card className="group overflow-hidden shadow-black/5 sm:col-span-2">
              <CardHeader className="p-6 md:p-8">
                {second.eyebrow ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">{second.eyebrow}</div> : null}
                <p className="text-2xl font-semibold text-foreground">{second.title}</p>
                <p className="text-sm leading-7 text-muted-foreground">{second.description}</p>
              </CardHeader>
              <CardContent className="pt-0">{renderVisual(second.visual)}</CardContent>
            </Card>
          ) : null}

          {third ? (
            <Card className="group p-0 shadow-black/5 sm:col-span-2">
              <CardHeader className="p-6 md:p-8">
                {third.eyebrow ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">{third.eyebrow}</div> : null}
                <p className="text-2xl font-semibold text-foreground">{third.title}</p>
                <p className="text-sm leading-7 text-muted-foreground">{third.description}</p>
              </CardHeader>
              <CardContent className="pt-0">{renderVisual(third.visual)}</CardContent>
            </Card>
          ) : null}

          {fourth ? (
            <Card className="group overflow-hidden shadow-black/5 sm:col-span-3">
              <CardHeader className="p-6 md:p-8">
                {fourth.eyebrow ? <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">{fourth.eyebrow}</div> : null}
                <p className="text-2xl font-semibold text-foreground">{fourth.title}</p>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground">{fourth.description}</p>
              </CardHeader>
              <CardContent className="pt-0">{renderVisual(fourth.visual)}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
