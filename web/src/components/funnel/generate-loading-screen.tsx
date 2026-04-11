"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/ui/loading/particle-effect";
import { trackEvent } from "@/lib/analytics";
import {
  isBackendUnavailableError,
  loadBookPreview,
  startBookPreviewPipeline,
  type BookPreview,
} from "@/lib/dashboard-api";
import { formatEta } from "@/lib/utils";

const AUTO_REDIRECT_MS = 18000;
const TIMER_TICK_MS = 250;
const PREVIEW_POLL_MS = 1500;

function parseSlugFromRedirectPath(redirectPath?: string) {
  if (!redirectPath) return "";
  const match = redirectPath.match(/\/book\/([^/]+)\/preview/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function GenerateLoadingScreen({
  onComplete,
  redirectPath,
}: {
  onComplete?: () => void;
  redirectPath?: string;
}) {
  const router = useRouter();
  const slug = useMemo(() => parseSlugFromRedirectPath(redirectPath), [redirectPath]);
  const redirectedRef = useRef(false);
  const bootstrapTriggeredRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(AUTO_REDIRECT_MS);
  const [preview, setPreview] = useState<BookPreview | null>(null);
  const [coverGateTimedOut, setCoverGateTimedOut] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Creating your real book cover");

  const previewPath = useMemo(() => {
    if (redirectPath) return redirectPath;
    if (slug) return `/app/book/${encodeURIComponent(slug)}/preview`;
    return "/app/library";
  }, [redirectPath, slug]);

  const navigateToPreview = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    trackEvent("fast_preview_loading_completed", {
      slug,
      cover_gate_timed_out: coverGateTimedOut,
    });
    if (onComplete) {
      onComplete();
      return;
    }
    router.push(previewPath);
  }, [coverGateTimedOut, onComplete, previewPath, router, slug]);

  useEffect(() => {
    trackEvent("fast_preview_loading_started");

    const startedAt = Date.now();

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextRemaining = Math.max(0, AUTO_REDIRECT_MS - elapsed);
      setRemainingMs(nextRemaining);
    }, TIMER_TICK_MS);

    const autoRedirect = window.setTimeout(() => {
      setCoverGateTimedOut(true);
      trackEvent("preview_cover_gate_timeout", { slug });
      navigateToPreview();
    }, AUTO_REDIRECT_MS);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(autoRedirect);
    };
  }, [navigateToPreview, slug]);

  useEffect(() => {
    if (!slug) return;
    bootstrapTriggeredRef.current = false;
    pollInFlightRef.current = false;
  }, [slug]);

  useEffect(() => {
    if (!slug || bootstrapTriggeredRef.current) return;
    bootstrapTriggeredRef.current = true;
    void startBookPreviewPipeline(slug, { trigger: "system" }).catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    let pollTimer: number | undefined;

    const pollPreview = async () => {
      if (cancelled || redirectedRef.current || pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      let shouldContinuePolling = true;
      try {
        const payload = await loadBookPreview(slug);
        if (cancelled) return;
        setPreview(payload);

        const generation = payload.generation || {};
        const nextLabel =
          String(generation.current_step_label || "").trim() ||
          (!generation.cover_ready
            ? "Creating your real book cover"
            : !generation.preview_ready
              ? "Writing the first readable chapter"
              : "Opening your live preview");
        setStatusLabel(nextLabel);

        if (generation.cover_ready || generation.preview_ready) {
          trackEvent("preview_cover_gate_passed", {
            slug,
            cover_ready: Boolean(generation.cover_ready),
            preview_ready: Boolean(generation.preview_ready),
          });
          navigateToPreview();
          shouldContinuePolling = false;
        }
      } catch (error) {
        if (cancelled) return;
        if (isBackendUnavailableError(error)) {
          setStatusLabel("Preview service is waking up");
          return;
        }
        setStatusLabel("Preparing your live preview");
      } finally {
        pollInFlightRef.current = false;
        if (!cancelled && !redirectedRef.current && shouldContinuePolling) {
          pollTimer = window.setTimeout(() => {
            void pollPreview();
          }, PREVIEW_POLL_MS);
        }
      }
    };

    void pollPreview();

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) {
        window.clearTimeout(pollTimer);
      }
    };
  }, [navigateToPreview, slug]);

  const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((AUTO_REDIRECT_MS - remainingMs) / AUTO_REDIRECT_MS) * 100)),
  );
  const generation = preview?.generation;
  const coverEta = formatEta(generation?.cover_eta_seconds);
  const chapterEta = formatEta(generation?.first_chapter_eta_seconds);
  const stageCards = [
    {
      key: "cover",
      label: "Cover",
      done: Boolean(generation?.cover_ready),
      active: !generation?.cover_ready,
      detail: generation?.cover_ready
        ? "Real cover is ready"
        : coverEta
          ? `Estimated ${coverEta}`
          : "Generating first",
    },
    {
      key: "chapter",
      label: "First chapter",
      done: Boolean(generation?.preview_ready),
      active: Boolean(generation?.cover_ready) && !generation?.preview_ready,
      detail: generation?.preview_ready
        ? "Readable pages are ready"
        : chapterEta
          ? `Estimated ${chapterEta}`
          : "Writing after cover",
    },
    {
      key: "full",
      label: "Full book",
      done: Boolean(generation?.product_ready),
      active: Boolean(generation?.preview_ready) && !generation?.product_ready,
      detail: generation?.product_ready
        ? "Unlocked"
        : "Continues in background",
    },
  ];

  return (
    <div className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden px-4 py-10" aria-busy="true">
      <GradientBackground className="opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(254,215,170,0.35),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.2),transparent_40%)]" />

      <div className="relative z-10 w-full max-w-xl rounded-[28px] border border-border/60 bg-background/95 p-6 shadow-[0_24px_60px_rgba(20,14,9,0.16)] backdrop-blur-sm md:p-10">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Preparing Your Live Preview
            </h2>
            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              {statusLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 md:p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Cover Gate
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {stageCards.map((item) => (
                <div key={item.key} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {item.done ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : item.active ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <div className="size-4 rounded-full border border-border" />
                    )}
                    {item.label}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-primary transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Redirects automatically in <span className="font-semibold text-foreground">{secondsLeft}s</span> if the cover is still pending.
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="h-12 w-full text-base font-semibold"
            onClick={navigateToPreview}
          >
            Open Live Preview Now
            <ArrowRight className="ml-2 size-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Generation continues in the background even if you close this page.
            {" "}
            <Link href={previewPath} className="font-medium text-foreground underline underline-offset-2">
              Open manually
            </Link>
            {" "}
            if automatic redirect is blocked.
          </p>
        </div>
      </div>
    </div>
  );
}
