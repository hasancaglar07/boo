"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/preview-auth";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

// Stage 1: 2 seconds — cover draft
// Stage 2: 3 seconds — first chapter preview
// Then redirect to preview screen

const FAST_STAGES = [
  {
    id: "cover",
    label: "Kapak taslağı hazırlanıyor",
    description: "AI kapak tasarımı oluşturuluyor...",
    durationMs: 2000,
    emoji: "🎨",
  },
  {
    id: "chapter",
    label: "İlk bölümün %20'si yazılıyor",
    description: "İlk paragraflar kaleme alınıyor...",
    durationMs: 3000,
    emoji: "✍️",
  },
] as const;

type FastStageId = (typeof FAST_STAGES)[number]["id"];

const TIPS = [
  "💡 Arka planda tam kitap üretimi başladı — izleyebilirsin",
  "📚 EPUB ve PDF formatında KDP'ye hazır dosyalar hazırlanıyor",
  "🎨 Kapak tasarımı AI tarafından otomatik oluşturuluyor",
  "✏️ Her bölümü sonradan düzenleyebilir, yeniden üretebilirsin",
  "🌍 15+ dilde kitap üretilebiliyor",
];

interface GenerateLoadingScreenProps {
  onComplete?: () => void;
  redirectPath?: string;
}

export function GenerateLoadingScreen({ onComplete, redirectPath }: GenerateLoadingScreenProps) {
  const router = useRouter();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<FastStageId[]>([]);
  const [tipIndex, setTipIndex] = useState(0);
  const [isLoggedIn] = useState(() => getSession() !== null);
  const [animationDone, setAnimationDone] = useState(false);
  const canNavigate = Boolean(onComplete || redirectPath);

  useEffect(() => {
    trackEvent("fast_preview_loading_started");

    // Stage 1: cover draft — 2 seconds
    const coverTimer = window.setTimeout(() => {
      setCompletedStages(["cover"]);
      setActiveStageIndex(1);
    }, FAST_STAGES[0].durationMs);

    // Stage 2: first chapter — 3 more seconds
    const chapterTimer = window.setTimeout(() => {
      setCompletedStages(["cover", "chapter"]);
      setAnimationDone(true);
      trackEvent("fast_preview_loading_completed");
    }, FAST_STAGES[0].durationMs + FAST_STAGES[1].durationMs);

    // Rotate tips every 3 seconds
    const tipTimer = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length);
    }, 3000);

    return () => {
      window.clearTimeout(coverTimer);
      window.clearTimeout(chapterTimer);
      window.clearInterval(tipTimer);
    };
  }, []);

  useEffect(() => {
    if (!animationDone || !canNavigate) return;

    const navigationTimer = window.setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else if (redirectPath) {
        router.push(redirectPath);
      }
    }, 600);

    return () => {
      window.clearTimeout(navigationTimer);
    };
  }, [animationDone, canNavigate, onComplete, redirectPath, router]);

  function handleSignup() {
    trackEvent("signup_prompt_clicked", { location: "generate_loading" });
    router.push("/signup");
  }

  const totalMs = FAST_STAGES.reduce((sum, s) => sum + s.durationMs, 0);
  const elapsedMs = completedStages.reduce((sum, id) => {
    const stage = FAST_STAGES.find((s) => s.id === id);
    return sum + (stage?.durationMs ?? 0);
  }, 0);
  const done = animationDone && canNavigate;
  const progressPercent = done ? 100 : animationDone ? 92 : Math.round((elapsedMs / totalMs) * 100);
  const mainLabel = done
    ? "Önizleme hazır! Açılıyor..."
    : !canNavigate
      ? "Kitap kaydediliyor ve preview erişimi hazırlanıyor..."
      : FAST_STAGES[activeStageIndex]?.description ?? "Hazırlanıyor...";

  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-busy={!done} aria-label="Kitap hazırlanıyor">

      {/* ── Hero status card ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-[20px] border px-5 py-4 transition-colors duration-500",
          done
            ? "border-emerald-500/30 bg-emerald-500/8"
            : "border-primary/20 bg-primary/8",
        )}
      >
        {done ? (
          <Check className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        ) : (
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
        )}
        <div className="flex-1">
          <div className="text-[15px] font-semibold text-foreground">
            {done ? "Önizleme hazır!" : !canNavigate ? "Kitabın kaydediliyor…" : "Kitabının önizlemesi hazırlanıyor…"}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">{mainLabel}</div>
        </div>
        <div
          className={cn(
            "shrink-0 text-sm font-bold tabular-nums",
            done ? "text-emerald-600 dark:text-emerald-400" : "text-primary",
          )}
        >
          %{progressPercent}
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Hızlı önizleme</span>
          <span>
            {completedStages.length} / {FAST_STAGES.length} aşama
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              done ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Stage cards ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {FAST_STAGES.map((stage, index) => {
          const isDone = completedStages.includes(stage.id);
          const isActive = !isDone && index === activeStageIndex;
          const isPending = !isDone && !isActive;

          return (
            <div
              key={stage.id}
              className={cn(
                "flex items-center gap-3 rounded-[18px] border px-4 py-3.5 transition-all duration-300",
                isActive && "border-primary/25 bg-primary/8 shadow-sm",
                isDone && "border-border bg-card",
                isPending && "border-border/50 bg-background/50 opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-base transition-all duration-300",
                  isActive && "bg-primary/15",
                  isDone && "bg-foreground/8",
                  isPending && "bg-muted",
                )}
              >
                {isDone ? (
                  <Check className="size-3.5 text-foreground" aria-hidden="true" />
                ) : isActive ? (
                  <span className="text-sm">{stage.emoji}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{stage.label}</div>
                {isActive && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{stage.description}</div>
                )}
              </div>
              {isActive && (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden="true" />
              )}
              {isDone && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Hazır
                </span>
              )}
            </div>
          );
        })}

        {/* Background generation note */}
        <div className="flex items-center gap-3 rounded-[18px] border border-border/50 bg-background/50 px-4 py-3.5 opacity-70">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-muted-foreground">Tam kitap arka planda üretiliyor</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Siz önizlemeyi okurken kalan bölümler yazılıyor
            </div>
          </div>
        </div>
      </div>

      {/* ── Rotating tip ─────────────────────────────────────────────────── */}
      <div className="rounded-[18px] border border-border/80 bg-card/60 px-5 py-4">
        <p className="text-sm leading-6 text-muted-foreground transition-all duration-500">
          {TIPS[tipIndex]}
        </p>
      </div>

      {/* ── Guest signup CTA ─────────────────────────────────────────────── */}
      {!isLoggedIn && (
        <div className="rounded-[20px] border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl">
              🎁
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Kitabını Kaybetme</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Önizleme hazır olduğunda hesabına bağlayabiliriz. Kaldığın yerden devam et.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSignup}>
                  Hesabına Bağla
                </Button>
                <span className="text-xs text-muted-foreground">Ücretsiz · Kredi kartı yok</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
