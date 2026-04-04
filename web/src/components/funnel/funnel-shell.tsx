import { List, MessageSquare, Palette, Play, Type } from "lucide-react";
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
  const containerClass = embedded ? "mx-auto w-full max-w-[1240px]" : "shell";
  const sceneBooks = getSeededSiteBooks(`${step || "preview"}:${title}`, 3);

  return (
    <div className={cn("text-foreground", embedded ? "w-full" : "min-h-dvh bg-background")}>
      {!embedded ? (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
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
            <div className="flex items-center gap-2">
              {step ? (
                <span className="text-xs text-muted-foreground sm:hidden" aria-hidden="true">
                  {activeIndex + 1}/{FUNNEL_STEPS.length}
                </span>
              ) : null}
              <ThemeToggle />
            </div>
          </div>
        </header>
      ) : null}

      {/* Railway progress */}
      {step ? (
        <div className="border-b border-border/40 bg-card/30">
          <div className={cn(containerClass, "py-4")}>
            <ol className="flex items-center">
              {FUNNEL_STEPS.map((item, index) => {
                const done = index < activeIndex;
                const active = index === activeIndex;
                const upcoming = index > activeIndex;
                return (
                  <li key={item} className="flex items-center flex-1 last:flex-none">
                    {/* Node */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "relative flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                          active
                            ? "bg-foreground text-background shadow-lg shadow-foreground/20 scale-110"
                            : done
                              ? "bg-foreground/15 text-foreground border border-foreground/20"
                              : "bg-muted text-muted-foreground border border-border",
                        )}
                      >
                        {done ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (() => {
                          const Icon = STEP_ICONS[item];
                          return <Icon className={cn("size-3.5", active ? "opacity-100" : "opacity-60")} aria-hidden="true" />;
                        })()}
                        {active && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-foreground/20 duration-1000" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium tracking-wide transition-all",
                          active ? "block" : "hidden sm:block",
                          active ? "text-foreground font-semibold" : done ? "text-foreground/60" : "text-muted-foreground",
                        )}
                      >
                        {STEP_LABELS[item]}
                      </span>
                    </div>

                    {/* Rail */}
                    {index < FUNNEL_STEPS.length - 1 && (
                      <div className="relative flex-1 mx-1.5 h-px -mt-5 sm:-mt-4 overflow-hidden">
                        <div className="absolute inset-0 bg-border/60" />
                        {done && (
                          <div className="absolute inset-0 bg-foreground/30 transition-all duration-500" />
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      ) : null}

      {/* Main layout */}
      <div className={cn(containerClass, embedded ? "py-0 md:py-0" : "py-10 md:py-14")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Content */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
              {step ? `Adım ${activeIndex + 1} / ${FUNNEL_STEPS.length}` : (eyebrow || "Kitap Oluşturucu")}
            </div>
            <h1 className="font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-[2.6rem]">
              {title}
            </h1>
            <p className="mt-2.5 text-base leading-7 text-muted-foreground max-w-xl">{description}</p>

            {/* Mobile collapsible summary */}
            {summary && summary.length > 0 && (
              <details className="lg:hidden mt-4 rounded-xl border border-border/60 bg-card/60 overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-foreground select-none">
                  <span>Kitabın özeti</span>
                  <svg className="size-4 text-muted-foreground transition-transform [[open]>&]:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-2">
                  {summary.map((item) => (
                    <div key={item.label}>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50">{item.label}</div>
                      <div className="mt-0.5 text-xs font-medium text-foreground">
                        {item.value || <span className="text-muted-foreground/40 font-normal">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="mt-8">{children}</div>
          </div>

          {/* Sidebar — hidden on mobile, sticky on lg+ */}
          <aside className="hidden lg:block space-y-4 lg:sticky lg:top-24 lg:h-fit">
            {/* 3D Book scene */}
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 23px, currentColor 23px, currentColor 24px)",
                }}
              />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="relative h-[104px] w-[88px] shrink-0" style={{ perspective: "1000px" }}>
                    {sceneBooks.map((book, index) => (
                      <div
                        key={book.slug}
                        className="absolute top-1/2 left-1/2 overflow-hidden rounded-[10px] border border-white/10 bg-stone-950 shadow-xl"
                        style={{
                          height: index === 1 ? "82px" : "76px",
                          width: index === 1 ? "58px" : "54px",
                          transformStyle: "preserve-3d",
                          transform:
                            index === 0
                              ? "translate3d(-52px,-44px,0) rotateY(22deg) rotateX(3deg) rotateZ(-9deg)"
                              : index === 1
                                ? "translate3d(-18px,-38px,18px) rotateY(-8deg) rotateX(5deg) rotateZ(1deg)"
                                : "translate3d(14px,-30px,-4px) rotateY(-26deg) rotateX(3deg) rotateZ(10deg)",
                        }}
                      >
                        <Image
                          src={siteExamplePublicCoverUrl(book.slug)}
                          alt={`${book.title} kapağı`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/16 via-transparent to-black/10" />
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-black/26 shadow-inner" />
                        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
                      </div>
                    ))}
                    <div className="absolute inset-x-2 bottom-1 h-4 rounded-full bg-black/12 blur-md" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/60 mb-1">
                      Kitabın
                    </div>
                    {summary && summary.length > 0 ? (
                      <div className="space-y-2">
                        {summary.slice(0, 2).map((item) => (
                          <div key={item.label}>
                            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50">
                              {item.label}
                            </div>
                            <div className="text-sm font-semibold text-foreground leading-snug">
                              {item.value || <span className="text-muted-foreground/40 font-normal">—</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground/50 italic">Henüz başlanmadı</div>
                    )}
                  </div>
                </div>

                {/* Extra summary items */}
                {summary && summary.length > 2 && (
                  <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-3">
                    {summary.slice(2).map((item) => (
                      <div key={item.label}>
                        <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-foreground">
                          {item.value || <span className="text-muted-foreground/40 font-normal">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/60">
                  Ücretsiz ön izleme
                </div>
              </div>
              <div className="text-xs leading-5 text-muted-foreground">
                Önce kapağı, bölüm planını ve okunabilir ön izlemeyi görürsün.{" "}
                <span className="text-foreground/70 font-medium">Tam kitap, PDF ve EPUB</span> daha sonra açılır.
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Yayın yolu
              </div>
              <div className="mt-2 text-xs leading-5 text-muted-foreground">
                Bu akış pazarlama vaadini doğrulamak için tasarlandı: konunu gir, ön izlemeyi gör, sonra kitabı açma kararını ver.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
