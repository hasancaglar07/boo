"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressCircular } from "@/components/ui/loading";
import { getSession, syncPreviewAuthState } from "@/lib/preview-auth";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const MOTIVATION_FACTS = [
  `📚 ${KDP_LIVE_BOOKS_CLAIM}`,
  `🛡️ ${KDP_GUARANTEE_CLAIM}`,
  "🧭 First, you'll see the chapter plan and cover",
  "🌍 Multilingual interface, multilingual book output",
  "🖼️ There are 30 real showcase books on the display",
  "📦 Open EPUB and PDF with full access",
  `⚙️ ${NO_API_COST_CLAIM}`,
  "✨ You can test the preview logic before payment",
];

const LOADING_STAGES = [
  { id: "init" as const, label: "Initializing...", durationMs: 800 },
  { id: "loading" as const, label: "Loading content...", durationMs: 1500 },
  { id: "ready" as const, label: "Almost ready...", durationMs: 700 },
];

type LoadingStageId = "init" | "loading" | "ready";

export default function RootLoading() {
  const [factIndex, setFactIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<LoadingStageId[]>([]);

  useEffect(() => {
    // Rotate facts every 4 seconds
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % MOTIVATION_FACTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Simulate loading stages
  useEffect(() => {
    const initTimer = setTimeout(() => {
      setCompletedStages(["init"]);
      setActiveStageIndex(1);
    }, LOADING_STAGES[0].durationMs);

    const loadingTimer = setTimeout(() => {
      setCompletedStages(["init", "loading"]);
      setActiveStageIndex(2);
    }, LOADING_STAGES[0].durationMs + LOADING_STAGES[1].durationMs);

    const readyTimer = setTimeout(() => {
      setCompletedStages(["init", "loading", "ready"]);
    }, LOADING_STAGES[0].durationMs + LOADING_STAGES[1].durationMs + LOADING_STAGES[2].durationMs);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(loadingTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoggedIn(getSession() !== null);

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      if (payload) {
        setIsLoggedIn(payload.authenticated);
        return;
      }
      setIsLoggedIn(getSession() !== null);
    });

    return () => {
      active = false;
    };
  }, []);

  // Calculate progress
  const totalMs = LOADING_STAGES.reduce((sum, s) => sum + s.durationMs, 0);
  const elapsedMs = completedStages.reduce((sum, id) => {
    const stage = LOADING_STAGES.find((s) => s.id === id);
    return sum + (stage?.durationMs ?? 0);
  }, 0);
  const progressPercent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

  return (
    <main className="shell flex min-h-[60vh] items-center justify-center py-24">
      <div className="w-full max-w-xl rounded-[28px] border border-border/80 bg-card/80 p-8 text-center">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <ProgressCircular
            value={progressPercent}
            size="lg"
            showPercentage={false}
            isComplete={completedStages.length === LOADING_STAGES.length}
          />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {LOADING_STAGES[activeStageIndex]?.label || "Loading..."}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          There may be a brief wait while content loads.
        </p>

        {/* Stage Indicators */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {LOADING_STAGES.map((stage, index) => {
            const isDone = completedStages.includes(stage.id);
            const isActive = !isDone && index === activeStageIndex;

            return (
              <div key={stage.id} className="flex items-center">
                {index > 0 && (
                  <div className={`h-px w-6 transition-colors duration-300 ${
                    completedStages.includes(LOADING_STAGES[index - 1].id)
                      ? "bg-primary/60"
                      : "bg-border"
                  }`} />
                )}
                <div className={`flex items-center justify-center size-8 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                    : isDone
                    ? "bg-emerald-500/20 text-emerald-600"
                    : "bg-muted/50 text-muted-foreground"
                }`}>
                  {isDone ? (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className={`size-2 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-current"}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivational Fact */}
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 transition-all duration-500">
          <p className="text-xs font-medium text-primary">
            {MOTIVATION_FACTS[factIndex]}
          </p>
        </div>

        {/* Signup CTA for guest users */}
        {isLoggedIn === false && (
          <div className="mt-6 space-y-2">
            <p className="text-xs text-muted-foreground">
              🎁🎁 If you don't want to lose your books:
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
