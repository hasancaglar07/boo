"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, BookOpen, Image as ImageIcon, Download, Target, User, Sparkles, ArrowRight } from "lucide-react";
import { signOut } from "next-auth/react";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearClientAuthState, getAccount, getPlan, hasPremiumAccess } from "@/lib/preview-auth";
import { useSessionGuard } from "@/lib/use-session-guard";
import { isBackendUnavailableError, loadBooks, type Book } from "@/lib/dashboard-api";
import { compactNumber, cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

// ─── Profile Completion Checklist ────────────────────────────────────────────

const PROFILE_STORAGE_KEY = "book_generator_profile_checklist";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action?: { label: string; href: string };
};

function buildChecklistItems(
  account: { name: string; email: string; goal: string },
  books: Book[],
  plan: string,
): ChecklistItem[] {
  const exports = books.reduce((t, b) => t + Number(b.status?.export_count || 0), 0);
  const hasBook = books.length > 0;
  const hasExport = exports > 0;
  const hasPremium = hasPremiumAccess(plan);
  const hasGoal = !!account.goal && account.goal.trim().length > 0;
  const hasName = !!account.name && account.name !== "Book Creator";

  return [
    {
      id: "account_created",
      label: "Hesap oluştur",
      description: "E-posta ile kayıt oldun",
      icon: <User className="size-4" />,
      completed: true, // always true if viewing this page
    },
    {
      id: "profile_name",
      label: "İsim ekle",
      description: hasName ? account.name : "Profiline gerçek adını ekle",
      icon: <User className="size-4" />,
      completed: hasName,
      action: hasName ? undefined : { label: "Düzenle", href: "/app/settings/profile" },
    },
    {
      id: "set_goal",
      label: "Hedef belirle",
      description: hasGoal ? account.goal.slice(0, 60) + (account.goal.length > 60 ? "…" : "") : "Ne yazmak istediğini tarif et",
      icon: <Target className="size-4" />,
      completed: hasGoal,
      action: hasGoal ? undefined : { label: "Hedef Ekle", href: "/app/settings/profile" },
    },
    {
      id: "first_book",
      label: "İlk kitabı oluştur",
      description: hasBook ? `${books.length} kitap oluşturdun` : "Wizard ile ilk kitabını yaz",
      icon: <BookOpen className="size-4" />,
      completed: hasBook,
      action: hasBook ? undefined : { label: "Başla", href: "/app/new" },
    },
    {
      id: "cover_generated",
      label: "Kapak tasarla",
      description: "AI ile kitap kapağı oluştur",
      icon: <ImageIcon className="size-4" />,
      completed: hasBook, // proxy: if they have a book they've seen cover step
      action: hasBook ? undefined : { label: "Kitap Oluştur", href: "/app/new" },
    },
    {
      id: "first_export",
      label: "PDF / EPUB dışa aktar",
      description: hasExport ? `${exports} dışa aktarım yaptın` : "Kitabını indirilebilir formata çevir",
      icon: <Download className="size-4" />,
      completed: hasExport,
      action: hasExport ? undefined : { label: "Kütüphaneye Git", href: "/app/library" },
    },
    {
      id: "upgrade_plan",
      label: "Premium'a geç",
      description: hasPremium ? `${plan} planındasın` : "Tam erişim için planını yükselt",
      icon: <Sparkles className="size-4" />,
      completed: hasPremium,
      action: hasPremium ? undefined : { label: "Planları Gör", href: "/pricing" },
    },
  ];
}

function loadStoredCompletions(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveStoredCompletions(data: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">Profil tamamlanma</span>
        <span className="text-xs font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyStateMessage({ label, actionLabel, href }: { label: string; actionLabel?: string; href?: string }) {
  const router = useRouter();
  return (
    <span className="text-muted-foreground italic text-sm">
      {label}
      {actionLabel && href && (
        <>
          {" "}
          <button
            onClick={() => router.push(href)}
            className="text-primary underline-offset-2 hover:underline font-medium not-italic"
          >
            {actionLabel}
          </button>
        </>
      )}
    </span>
  );
}

function CelebrationBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-[20px] border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 px-5 py-5">
      <div className="flex items-start gap-4">
        <div className="text-3xl select-none">🎉</div>
        <div className="flex-1">
          <p className="text-base font-bold text-foreground">Profilin %100 tamamlandı!</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Harika iş! Tüm adımları tamamladın. Artık kitap yazma yolculuğuna tam hazırsın.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => void 0}>
              Kitap Yaz
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NextStepSuggestions({ items }: { items: ChecklistItem[] }) {
  const router = useRouter();
  const incomplete = items.filter((i) => !i.completed && i.action);
  if (incomplete.length === 0) return null;

  const next = incomplete.slice(0, 2);

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Sıradaki adımlar</h3>
      <div className="flex flex-col gap-2">
        {next.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              trackEvent("profile_next_step_clicked", { step_id: item.id });
              if (item.action?.href) router.push(item.action.href);
            }}
            className="group flex items-center gap-3 rounded-[14px] border border-border/60 bg-background/60 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/40"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground truncate">{item.description}</div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileChecklist({ items, onToggle }: { items: ChecklistItem[]; onToggle: (id: string) => void }) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "group flex w-full items-center gap-3 rounded-[16px] border px-4 py-3 transition-all",
            item.completed
              ? "border-primary/20 bg-primary/6"
              : "border-border/60 bg-background/60",
          )}
        >
          <button
            onClick={() => onToggle(item.id)}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
              item.completed
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {item.completed ? <Check className="size-3" /> : null}
          </button>

          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {item.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-sm font-medium",
                item.completed ? "text-foreground line-through opacity-50" : "text-foreground",
              )}
            >
              {item.label}
            </div>
            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
          </div>

          {!item.completed && item.action && (
            <button
              onClick={() => {
                trackEvent("profile_next_step_clicked", { step_id: item.id });
                router.push(item.action!.href);
              }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {item.action.label}
              <ChevronRight className="size-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AccountScreen() {
  const ready = useSessionGuard();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [manualCompletions, setManualCompletions] = useState<Record<string, boolean>>({});
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [prevPct, setPrevPct] = useState<number | null>(null);

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
    setManualCompletions(loadStoredCompletions());
  }, [ready]);

  // Compute derived values unconditionally (before early returns)
  const account = getAccount();
  const plan = getPlan();
  const exports = books.reduce((total, book) => total + Number(book.status?.export_count || 0), 0);

  const baseItems = buildChecklistItems(account, books, plan);
  const items: ChecklistItem[] = baseItems.map((item) => ({
    ...item,
    completed: item.completed || !!manualCompletions[item.id],
  }));

  const completedCount = items.filter((i) => i.completed).length;
  const pct = Math.round((completedCount / items.length) * 100);
  const isComplete = completedCount === items.length;

  // Track completion rate when pct changes — must be before early returns
  useEffect(() => {
    if (!ready || pct === prevPct) return;
    setPrevPct(pct);
    trackEvent("profile_completion_rate", { rate: pct, completed: completedCount, total: items.length });
    if (isComplete) {
      trackEvent("profile_celebration_shown", {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, ready]);

  if (!ready) return null;
  if (backendUnavailable) {
    return (
      <AppFrame current="account" title="Hesap" subtitle="Bağlantı sorunu oluştu." books={[]}>
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

  function handleToggle(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    // Only allow manual toggle for non-auto-detected items
    if (item.completed && !manualCompletions[id]) return; // auto-completed, can't untoggle
    const newCompletions = { ...manualCompletions, [id]: !manualCompletions[id] };
    setManualCompletions(newCompletions);
    saveStoredCompletions(newCompletions);
    if (!item.completed) {
      trackEvent("profile_checklist_item_completed", { step_id: id });
    }
  }

  return (
    <AppFrame
      current="account"
      title="Hesap"
      subtitle="Profil ve kullanım özeti."
      books={books}
      primaryAction={{
        label: "Çıkış yap",
        onClick: async () => {
          await signOut({ redirect: false, callbackUrl: "/" });
          clearClientAuthState();
          router.push("/");
        },
      }}
    >
      {/* ── Stats Row ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Ad</div>
            {account.name && account.name !== "Book Creator" ? (
              <div className="mt-3 text-xl font-medium text-foreground">{account.name}</div>
            ) : (
              <div className="mt-3">
                <EmptyStateMessage label="İsim eklenmemiş." actionLabel="Ekle" href="/app/settings/profile" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">E-posta</div>
            <div className="mt-3 text-xl font-medium text-foreground">{account.email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Plan</div>
            <div className="mt-3 text-xl font-medium text-foreground capitalize">{plan}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-4xl font-semibold text-foreground">{books.length}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {books.length === 0 ? (
                <EmptyStateMessage label="Henüz kitap yok." actionLabel="İlk kitabını oluştur →" href="/app/new" />
              ) : (
                "Toplam kitap"
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-4xl font-semibold text-foreground">{compactNumber(exports)}</div>
            <div className="mt-2 text-sm text-muted-foreground">
              {exports === 0 ? (
                <EmptyStateMessage label="Henüz dışa aktarım yok." actionLabel="PDF oluştur →" href="/app/library" />
              ) : (
                "Toplam çıktı"
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">Hedef</div>
            {account.goal ? (
              <div className="mt-3 text-base leading-7 text-foreground">{account.goal}</div>
            ) : (
              <div className="mt-3">
                <EmptyStateMessage label="Hedef belirlenmemiş." actionLabel="Hedef ekle →" href="/app/settings/profile" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Profile Completion Section ── */}
      <div className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Profil Tamamlama</h2>
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            {completedCount}/{items.length} tamamlandı
          </span>
        </div>

        <ProfileProgressBar pct={pct} />

        {/* Celebration */}
        {isComplete && !celebrationDismissed ? (
          <div className="mt-4 mb-4">
            <CelebrationBanner onDismiss={() => setCelebrationDismissed(true)} />
          </div>
        ) : (
          <div className="mb-4 mt-2 rounded-[12px] border border-border/50 bg-background/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {completedCount === 0
                ? "Profil tamamlamaya başlamak için aşağıdaki adımları takip et."
                : completedCount < 4
                ? `İyi gidiyorsun! ${items.length - completedCount} adım kaldı.`
                : `Neredeyse bitti! Son ${items.length - completedCount} adımı tamamla.`}
            </p>
          </div>
        )}

        <ProfileChecklist items={items} onToggle={handleToggle} />

        {/* Next Steps */}
        {!isComplete && <NextStepSuggestions items={items} />}
      </div>
    </AppFrame>
  );
}
