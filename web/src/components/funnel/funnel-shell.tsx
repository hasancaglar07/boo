"use client";

import { ArrowLeft, ArrowRight, BookOpen, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { FUNNEL_STEPS, type FunnelStep } from "@/lib/funnel-draft";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<FunnelStep, string> = {
  topic: "Konu",
  title: "Başlık",
  outline: "Bölümler",
  style: "Stil",
  generate: "Oluştur",
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
  const isLastStep = activeIndex === FUNNEL_STEPS.length - 1;
  const showBottomBar = step && !isLastStep;

  return (
    <div className="text-foreground min-h-dvh bg-background">

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 bg-gradient-to-b from-background to-background/95 backdrop-blur-md">
        {/* Top row: logo/brand */}
        <div className="flex h-12 items-center px-4 sm:h-13 sm:px-6">
          {!embedded ? (
            <Link href="/" className="shrink-0 transition-all duration-300 hover:opacity-80">
              <span className="relative block h-6 w-[100px] overflow-hidden sm:h-7 sm:w-[120px]">
                <Image
                  src="/logo.png"
                  alt="Kitap Oluşturucu"
                  className="h-full w-full object-contain object-left dark:hidden"
                  fill
                  priority
                  sizes="120px"
                />
                <Image
                  src="/dark-logo.png"
                  alt="Kitap Oluşturucu"
                  className="hidden h-full w-full object-contain object-left dark:block"
                  fill
                  priority
                  sizes="120px"
                />
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <BookOpen className="size-4" />
              <span>Yeni Kitap</span>
            </div>
          )}

          <div className="flex-1" />

          {!embedded && <ThemeToggle />}
        </div>

        {/* Bottom row: connected stepper */}
        {step ? (
          <div className="border-t border-border/30 px-4 pb-2.5 pt-2 sm:px-6">
            <div className="mx-auto flex max-w-[480px] items-start justify-center">
              {FUNNEL_STEPS.map((item, index) => {
                const done = index < activeIndex;
                const active = index === activeIndex;
                const isLast = index === FUNNEL_STEPS.length - 1;

                return (
                  <div key={item} className="flex items-start">
                    <div className="flex flex-col items-center gap-[2px]">
                      <span
                        className={cn(
                          "flex items-center justify-center rounded-full text-[11px] sm:text-xs font-bold leading-none transition-all duration-300 size-8 sm:size-9",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : done
                              ? "bg-primary text-primary-foreground"
                              : "border-[1.5px] border-border/80 text-muted-foreground/60 bg-transparent",
                        )}
                      >
                        {done ? (
                          <Check className="size-3.5 stroke-[3]" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-center leading-none transition-colors duration-300 text-[10px] sm:text-xs font-medium max-w-[48px] truncate sm:max-w-none",
                          active
                            ? "text-primary font-semibold"
                            : done
                              ? "text-primary/50"
                              : "text-muted-foreground/40",
                        )}
                      >
                        {STEP_LABELS[item]}
                      </span>
                    </div>

                    {!isLast && (
                      <div
                        className={cn(
                          "h-[2px] w-4 sm:w-6 mx-[2px] mt-[14px] sm:mt-[16px] transition-all duration-500 rounded-full",
                          done
                            ? "bg-primary"
                            : active
                              ? "bg-primary/40"
                              : "bg-border/60",
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <div
        className={cn(
          "mx-auto w-full max-w-[640px] px-4 sm:px-6",
          showBottomBar ? "pb-32 pt-6 sm:pt-10" : "pb-8 pt-6 sm:pb-12 sm:pt-10",
        )}
      >
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-foreground transition-all duration-300">
            {title}
          </h1>
          <p className="mt-1.5 text-base sm:text-lg leading-relaxed text-muted-foreground/70 transition-all duration-300">
            {description}
          </p>
        </div>

        {summary && summary.length > 0 ? (
          <details className="mb-5 overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-300">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-semibold text-foreground select-none transition-all duration-300 hover:bg-muted/50">
              <span>📖 Kitap Özeti</span>
              <svg className="size-4 text-muted-foreground transition-transform duration-300 [[open]>&]:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-1.5">
              {summary.map((item) => (
                <div key={item.label} className="rounded-lg border border-border/40 bg-background/80 px-3 py-2 transition-all duration-300">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-xs font-medium leading-5 text-foreground truncate">
                    {item.value || <span className="font-normal text-muted-foreground/40">—</span>}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <div>{children}</div>
      </div>

      {/* ─── BOTTOM NAVIGATION BAR ─── */}
      {showBottomBar ? (
        <div className={cn(
          "fixed bottom-0 z-50 bg-background/98 backdrop-blur-xl border-t border-border/40",
          embedded ? "inset-x-0 lg:left-[288px]" : "inset-x-0"
        )}>
          <div className="mx-auto max-w-[640px] px-4 sm:px-6">
            <div className="flex items-center gap-3 h-[72px] sm:h-[76px]">

              {/* Geri */}
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => window.history.back()}
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition-all duration-300 active:scale-[0.92] sm:h-16 sm:w-16",
                  activeIndex === 0
                    ? "cursor-not-allowed border-border/20 bg-muted/30 text-muted-foreground/25"
                    : "border-border/50 bg-card text-foreground hover:bg-accent active:bg-accent/80",
                )}
              >
                <ArrowLeft className="size-5" strokeWidth={2.5} />
              </button>

              {/* Progress dots */}
              <div className="flex flex-1 items-center justify-center gap-1.5">
                {FUNNEL_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-300 h-2.5",
                      i === activeIndex
                        ? "w-8 bg-primary"
                        : i < activeIndex
                          ? "w-2.5 bg-primary/40"
                          : "w-2.5 bg-border/50",
                    )}
                  />
                ))}
              </div>

              {/* İleri */}
              <button
                type="submit"
                form="wizard-form"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.92] sm:h-16 sm:w-16"
              >
                <ArrowRight className="size-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          {/* iOS safe area */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      ) : null}
    </div>
  );
}
