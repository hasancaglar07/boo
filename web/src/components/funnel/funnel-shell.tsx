import { ArrowRight, Check, List, MessageSquare, Palette, Play, Sparkles, Type } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { FUNNEL_STEPS, type FunnelStep } from "@/lib/funnel-draft";
import { getSeededSiteBooks, siteExamplePublicCoverUrl } from "@/lib/site-real-books";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<FunnelStep, string> = {
  topic: "Konu",
  title: "Başlık",
  outline: "Bölümler",
  style: "Stil",
  generate: "Oluştur",
};

const STEP_DESCRIPTIONS: Record<FunnelStep, string> = {
  topic: "Fikrini netleştir",
  title: "İsmi konumlandır",
  outline: "Omurgayı kur",
  style: "Marka ve tonu seç",
  generate: "Ön izlemeyi başlat",
};

const STEP_ICONS: Record<FunnelStep, React.ComponentType<{ className?: string }>> = {
  topic: MessageSquare,
  title: Type,
  outline: List,
  style: Palette,
  generate: Play,
};

export function FunnelShell({
  step,
  eyebrow,
  title,
  description,
  summary,
  children,
  mode = "funnel",
}: {
  step?: FunnelStep;
  eyebrow?: string;
  title: string;
  description: string;
  summary?: Array<{ label: string; value: string }>;
  children: React.ReactNode;
  mode?: "funnel" | "embedded";
}) {
  const activeIndex = step ? FUNNEL_STEPS.indexOf(step) : -1;
  const embedded = mode === "embedded";
  const containerClass = embedded ? "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8" : "shell";
  const sceneBooks = getSeededSiteBooks(`${step || "preview"}:${title}`, 3);
  const completionRatio = step ? ((activeIndex + 1) / FUNNEL_STEPS.length) * 100 : 0;
  const currentStepLabel = step ? STEP_LABELS[step] : eyebrow || "Kitap Oluşturucu";
  const currentStepDescription = step ? STEP_DESCRIPTIONS[step] : "Akış";

  return (
    <div className={cn("text-foreground", embedded ? "w-full" : "min-h-dvh bg-background")}>
      {!embedded ? (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/92 backdrop-blur-xl">
          <div className="shell flex items-center justify-between py-3.5">
            <Link href="/" className="group flex items-center transition-opacity hover:opacity-90">
              <span className="relative block h-12 w-[220px] overflow-hidden sm:h-14 sm:w-[280px]">
                <Image
                  src="/logo.png"
                  alt="Kitap Oluşturucu"
                  className="h-full w-full object-contain object-left dark:hidden"
                  fill
                  priority
                  sizes="(min-width: 640px) 280px, 220px"
                />
                <Image
                  src="/dark-logo.png"
                  alt="Kitap Oluşturucu"
                  className="hidden h-full w-full object-contain object-left dark:block"
                  fill
                  priority
                  sizes="(min-width: 640px) 280px, 220px"
                />
              </span>
            </Link>
            <div className="flex items-center gap-2.5">
              {step ? (
                <div className="hidden rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground sm:flex sm:items-center sm:gap-2">
                  <span className="inline-flex size-1.5 rounded-full bg-primary" />
                  Adım {activeIndex + 1}/{FUNNEL_STEPS.length}
                </div>
              ) : null}
              <ThemeToggle />
            </div>
          </div>
        </header>
      ) : null}

      {step ? (
        <div className="border-b border-border/50 bg-[linear-gradient(180deg,rgba(var(--background),0.96),rgba(var(--card),0.82))]">
          <div className={cn(containerClass, "py-4 sm:py-5")}>
            <div className="rounded-[24px] border border-border/70 bg-card/55 px-4 py-4 shadow-sm sm:px-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    İlerleme
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {currentStepLabel} <span className="text-muted-foreground">• {currentStepDescription}</span>
                  </div>
                </div>
                <div className="rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
                  %{Math.round(completionRatio)} tamamlandı
                </div>
              </div>

              <div className="mb-4 h-2 overflow-hidden rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(var(--primary),0.45),rgba(var(--primary),1))] transition-all duration-500 ease-out"
                  style={{ width: `${completionRatio}%` }}
                />
              </div>

              <ol className="grid gap-2 sm:grid-cols-5">
                {FUNNEL_STEPS.map((item, index) => {
                  const done = index < activeIndex;
                  const active = index === activeIndex;
                  const upcoming = index > activeIndex;
                  const Icon = STEP_ICONS[item];

                  return (
                    <li key={item}>
                      <div
                        className={cn(
                          "group flex items-center gap-3 rounded-[18px] border px-3 py-3 transition-all duration-200",
                          active
                            ? "border-primary/30 bg-primary/[0.08] shadow-[0_8px_24px_rgba(var(--primary),0.10)]"
                            : done
                              ? "border-foreground/10 bg-foreground/[0.03]"
                              : "border-border/70 bg-background/65",
                        )}
                      >
                        <div
                          className={cn(
                            "relative flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                            active
                              ? "border-primary/25 bg-primary text-primary-foreground"
                              : done
                                ? "border-foreground/15 bg-foreground text-background"
                                : "border-border bg-card text-muted-foreground",
                          )}
                        >
                          {done ? <Check className="size-4" aria-hidden="true" /> : <Icon className="size-4" aria-hidden="true" />}
                          {active ? <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" /> : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "truncate text-sm font-semibold",
                              active ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground",
                            )}
                          >
                            {STEP_LABELS[item]}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{STEP_DESCRIPTIONS[item]}</div>
                        </div>

                        {active ? <ArrowRight className="size-4 text-primary" aria-hidden="true" /> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      ) : null}

      <div className={cn(containerClass, embedded ? "py-4 md:py-6" : "py-8 md:py-12")}>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
          <div>
            <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(var(--card),0.82),rgba(var(--background),0.92))] p-6 shadow-sm sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="size-3.5" />
                    {step ? `Adım ${activeIndex + 1} / ${FUNNEL_STEPS.length}` : eyebrow || "Kitap Oluşturucu"}
                  </div>
                  <h1 className="max-w-3xl font-serif text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-[2.7rem]">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-[15px]">
                    {description}
                  </p>
                </div>
              </div>

              {summary && summary.length > 0 ? (
                <details className="mt-5 overflow-hidden rounded-[22px] border border-border/70 bg-background/60 lg:hidden">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-foreground select-none">
                    <span>Kitap özeti</span>
                    <svg className="size-4 text-muted-foreground transition-transform [[open]>&]:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-1">
                    {summary.map((item) => (
                      <div key={item.label} className="rounded-[16px] border border-border/60 bg-card/70 px-3 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {item.label}
                        </div>
                        <div className="mt-1 text-xs font-medium leading-5 text-foreground">
                          {item.value || <span className="font-normal text-muted-foreground/40">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>

            <div className="mt-6 rounded-[28px] border border-border/70 bg-card/60 p-5 shadow-sm sm:p-6 lg:p-7">
              {children}
            </div>
          </div>

          <aside className="hidden xl:block xl:space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <div className="overflow-hidden rounded-[26px] border border-border/70 bg-[linear-gradient(180deg,rgba(var(--card),0.9),rgba(var(--background),0.96))] p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Canlı görünüm
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">Kitabın şekilleniyor</div>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                  aktif
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[22px] border border-border/60 bg-[radial-gradient(circle_at_top,rgba(var(--primary),0.14),transparent_38%),linear-gradient(180deg,rgba(30,24,20,0.98),rgba(74,54,42,0.94))] p-5 text-white">
                <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(transparent 95%, rgba(255,255,255,0.18) 96%)", backgroundSize: "100% 22px" }} />
                <div className="relative flex items-start gap-4">
                  <div className="relative h-[118px] w-[96px] shrink-0" style={{ perspective: "1000px" }}>
                    {sceneBooks.map((book, index) => (
                      <div
                        key={book.slug}
                        className="absolute top-1/2 left-1/2 overflow-hidden rounded-[12px] border border-white/10 bg-stone-950 shadow-2xl"
                        style={{
                          height: index === 1 ? "92px" : "84px",
                          width: index === 1 ? "64px" : "60px",
                          transformStyle: "preserve-3d",
                          transform:
                            index === 0
                              ? "translate3d(-56px,-46px,0) rotateY(22deg) rotateX(3deg) rotateZ(-10deg)"
                              : index === 1
                                ? "translate3d(-18px,-40px,18px) rotateY(-8deg) rotateX(5deg) rotateZ(1deg)"
                                : "translate3d(18px,-31px,-4px) rotateY(-28deg) rotateX(3deg) rotateZ(10deg)",
                        }}
                      >
                        <Image
                          src={siteExamplePublicCoverUrl(book.slug)}
                          alt={`${book.title} kapağı`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/16 via-transparent to-black/20" />
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-black/26 shadow-inner" />
                        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
                      </div>
                    ))}
                    <div className="absolute inset-x-2 bottom-1 h-4 rounded-full bg-black/20 blur-md" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Ön izleme</div>
                    {summary && summary.length > 0 ? (
                      <div className="mt-2 space-y-2.5">
                        {summary.slice(0, 3).map((item) => (
                          <div key={item.label}>
                            <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">{item.label}</div>
                            <div className="text-sm font-semibold leading-snug text-white/92">
                              {item.value || <span className="font-normal text-white/35">—</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm italic text-white/45">Henüz başlanmadı</div>
                    )}
                  </div>
                </div>
              </div>

              {summary && summary.length > 3 ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {summary.slice(3).map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-border/60 bg-background/60 px-3.5 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {item.label}
                      </div>
                      <div className="mt-1 text-xs font-medium leading-5 text-foreground">
                        {item.value || <span className="font-normal text-muted-foreground/40">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-primary/15 bg-primary/[0.05] p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/65">
                  Ücretsiz ön izleme
                </div>
              </div>
              <div className="text-sm leading-6 text-muted-foreground">
                Önce kapağı, bölüm planını ve okunabilir ön izlemeyi görürsün. <span className="font-medium text-foreground/80">Tam kitap, PDF ve EPUB</span> daha sonra açılır.
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-card/65 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Yayın yolu</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                Bu akış hızlı karar vermek için tasarlandı: konunu gir, kitabın vitrini oluşsun, sonra üretime güvenle geç.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
