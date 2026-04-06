"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

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

const questions = [
  {
    key: "type",
    title: "What kind of book do you want to write?",
    stepLabel: "Tür",
    options: [
      { value: "rehber", label: "Rehber" },
      { value: "is", label: "İş kitabı" },
      { value: "egitim", label: "Eğitim" },
      { value: "cocuk", label: "Çocuk kitabı" },
      { value: "diger", label: "Diğer" },
    ],
  },
  {
    key: "topic",
    title: "Konu ne?",
    stepLabel: "Konu",
    placeholder: "örnek: practical prompting for small teams",
  },
  {
    key: "audience",
    title: "Kime yazıyorsun?",
    stepLabel: "Hedef",
    placeholder: "örnek: first-time founders and operators",
  },
  {
    key: "language",
    title: "Hangi dilde üretelim?",
    stepLabel: "Dil",
    options: [
      { value: "English", label: "English" },
      { value: "Turkish", label: "Türkçe" },
    ],
  },
  {
    key: "depth",
    title: "Ne kadar detay istiyorsun?",
    stepLabel: "Derinlik",
    options: [
      { value: "hizli", label: "Kısa ve hızlı" },
      { value: "dengeli", label: "Dengeli" },
      { value: "detayli", label: "Daha detaylı" },
    ],
  },
] as const;

export function WizardScreen() {
  const ready = useSessionGuard();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [index, setIndex] = useState(0);
  const [fieldError, setFieldError] = useState("");
  const [creating, setCreating] = useState(false);
  const [answers, setAnswers] = useState({
    type: "rehber",
    topic: "",
    audience: "",
    language: "Turkish",
    depth: "dengeli",
  });
  const [backendUnavailable, setBackendUnavailable] = useState(false);

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
  const progress = useMemo(() => Math.round(((index + 1) / questions.length) * 100), [index]);
  const isLastStep = index === questions.length - 1;

  if (!ready) return null;

  if (backendUnavailable) {
    return (
      <AppFrame current="new" title="İlk kitabı başlat" subtitle="Bağlantı sorunu oluştu." books={books}>
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

  function goNext() {
    const isTextStep = !("options" in step);
    const val = String(answers[step.key] || "").trim();
    if (isTextStep && !val) {
      setFieldError("Bu alan boş bırakılamaz.");
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
        genre: answers.type === "is" ? "business" : answers.type === "rehber" ? "guide" : "non-fiction",
        audience: answers.audience,
        style: answers.depth === "hizli" ? "clear and concise" : answers.depth === "detayli" ? "detailed and example-driven" : "clear and practical",
        tone: answers.type === "cocuk" ? "warm" : "professional",
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
    <AppFrame current="new" title="New Book" subtitle="Start with 5 quick questions." books={books}>
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
                {step.options.map((option) => (
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
                  placeholder={step.placeholder}
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
              Geri
            </Button>
            <Button onClick={goNext} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Hazırlanıyor...
                </>
              ) : isLastStep ? (
                "Kitabı hazırla"
              ) : (
                "Devam"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
