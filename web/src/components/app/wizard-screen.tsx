"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackEvent, trackEventOnce } from "@/lib/analytics";
import {
  createFallbackBookPayload,
  isBackendUnavailableError,
  loadBooks,
  runWorkflow,
  saveBook,
  type Book,
} from "@/lib/dashboard-api";
import { getAccount, removeWizardState, saveWizardState } from "@/lib/preview-auth";
import { useSessionGuard } from "@/lib/use-session-guard";
import { cn } from "@/lib/utils";

export function WizardScreen() {
  const t = useTranslations("WizardScreen");
  const ready = useSessionGuard();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [index, setIndex] = useState(0);
  const [fieldError, setFieldError] = useState("");
  const [creating, setCreating] = useState(false);
  const [answers, setAnswers] = useState({
    type: "guide",
    topic: "",
    audience: "",
    language: "Turkish",
    depth: "balanced",
  });
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  const questions = useMemo(
    () => [
      {
        key: "type" as const,
        title: t("questions.type.title"),
        stepLabel: t("questions.type.stepLabel"),
        options: [
          { value: "guide", label: t("questions.type.options.guide") },
          { value: "business", label: t("questions.type.options.business") },
          { value: "education", label: t("questions.type.options.education") },
          { value: "children", label: t("questions.type.options.children") },
          { value: "other", label: t("questions.type.options.other") },
        ],
      },
      {
        key: "topic" as const,
        title: t("questions.topic.title"),
        stepLabel: t("questions.topic.stepLabel"),
        placeholder: t("questions.topic.placeholder"),
      },
      {
        key: "audience" as const,
        title: t("questions.audience.title"),
        stepLabel: t("questions.audience.stepLabel"),
        placeholder: t("questions.audience.placeholder"),
      },
      {
        key: "language" as const,
        title: t("questions.language.title"),
        stepLabel: t("questions.language.stepLabel"),
        options: [
          { value: "English", label: t("questions.language.options.English") },
          { value: "Turkish", label: t("questions.language.options.Turkish") },
        ],
      },
      {
        key: "depth" as const,
        title: t("questions.depth.title"),
        stepLabel: t("questions.depth.stepLabel"),
        options: [
          { value: "quick", label: t("questions.depth.options.quick") },
          { value: "balanced", label: t("questions.depth.options.balanced") },
          { value: "detailed", label: t("questions.depth.options.detailed") },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  async function refreshBooks() {
    try {
      const loaded = await loadBooks();
      setBooks(loaded);
      setBackendUnavailable(false);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        return;
      }
      console.error(error);
    }
  }

  useEffect(() => {
    if (!ready) return;
    void refreshBooks();
  }, [ready]);

  useEffect(() => {
    saveWizardState("draft", { index, answers });
  }, [answers, index]);

  useEffect(() => {
    if (!ready) return;
    trackEventOnce("wizard_started", { source: "app_new" }, { key: "wizard_started:app_new", ttlMs: 15_000 });
  }, [ready]);

  const step = questions[index];
  const progress = useMemo(() => Math.round(((index + 1) / questions.length) * 100), [index, questions.length]);
  const isLastStep = index === questions.length - 1;

  if (!ready) return null;

  if (backendUnavailable) {
    return (
      <AppFrame current="new" title={t("backendTitle")} subtitle={t("connectionError")} books={books}>
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

  function goNext() {
    const isTextStep = !("options" in step);
    const val = String(answers[step.key] || "").trim();
    if (isTextStep && !val) {
      setFieldError(t("fieldRequired"));
      return;
    }
    setFieldError("");
    if (isLastStep) {
      void createBook();
      return;
    }
    setIndex((v) => Math.min(questions.length - 1, v + 1));
  }

  async function createBook() {
    setCreating(true);
    const account = getAccount();
    const payload = createFallbackBookPayload({
      ...answers,
      author: account.name,
    });

    try {
      const response = await runWorkflow({
        action: "outline_generate",
        slug: payload.slug,
        topic: answers.topic,
        title: payload.title,
        subtitle: payload.subtitle,
        language: payload.language,
        author: payload.author,
        publisher: payload.publisher,
        description: payload.description,
        genre: answers.type === "business" ? "business" : answers.type === "guide" ? "guide" : "non-fiction",
        audience: answers.audience,
        style: answers.depth === "quick" ? "clear and concise" : answers.depth === "detailed" ? "detailed and example-driven" : "clear and practical",
        tone: answers.type === "children" ? "warm" : "professional",
        year: payload.year,
      });
      const book = response.book as Book | undefined;
      if (!book?.slug) {
        throw new Error("Outline generation did not return a valid book.");
      }
      removeWizardState("draft");
      trackEvent("wizard_completed", { slug: book.slug, provider_ready: true });
      router.push(`/app/book/${encodeURIComponent(book.slug)}?tab=book`);
    } catch {
      const book = await saveBook(payload);
      removeWizardState("draft");
      trackEvent("wizard_completed", { slug: book.slug, provider_ready: false, fallback: true });
      router.push(`/app/book/${encodeURIComponent(book.slug)}?tab=book`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppFrame current="new" title={t("title")} subtitle={t("subtitle")} books={books}>
      <Card className="mx-auto max-w-3xl">
        <CardContent className="p-8">
          {/* Progress header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {questions.map((q, i) => {
                const done = i < index;
                const active = i === index;
                return (
                  <div key={q.key} className="flex items-center gap-2">
                    <button
                      className={cn(
                        "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
                        done
                          ? "bg-primary/15 text-primary"
                          : active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                      onClick={() => i < index && setIndex(i)}
                      disabled={i >= index}
                    >
                      {done ? <Check className="size-3" /> : null}
                      {q.stepLabel}
                    </button>
                    {i < questions.length - 1 && (
                      <div className={cn("h-px w-4 rounded-full", i < index ? "bg-primary/40" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-foreground">{step.title}</h1>

          <div className="mt-8">
            {"options" in step ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(step.options ?? []).map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      "rounded-[24px] border p-5 text-left transition",
                      answers[step.key] === option.value
                        ? "border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/20"
                        : "border-border bg-background text-foreground hover:bg-accent",
                    )}
                    onClick={() => setAnswers((current) => ({ ...current, [step.key]: option.value }))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium">{option.label}</span>
                      {answers[step.key] === option.value && (
                        <Check className="size-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={answers[step.key]}
                  onChange={(event) => {
                    setFieldError("");
                    setAnswers((current) => ({ ...current, [step.key]: event.target.value }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  placeholder={"placeholder" in step ? step.placeholder : undefined}
                  className={cn("h-14 text-base", fieldError && "border-destructive focus-visible:ring-destructive")}
                  autoFocus
                />
                {fieldError && (
                  <p className="text-sm text-destructive">{fieldError}</p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={index === 0 || creating}
              onClick={() => {
                setFieldError("");
                setIndex((v) => Math.max(0, v - 1));
              }}
            >
              {t("back")}
            </Button>
            <Button onClick={goNext} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("preparing")}
                </>
              ) : isLastStep ? (
                t("prepareBook")
              ) : (
                t("continue")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
