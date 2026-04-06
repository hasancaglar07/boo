"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/preview-auth";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "book_generator_onboarding_checklist";

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 1, text: "Set your first book topic", completed: false },
  { id: 2, text: "Generate outline with AI", completed: false },
  { id: 3, text: "Select cover style", completed: false },
  { id: 4, text: "Preview gör", completed: false },
  { id: 5, text: "Link to your account", completed: false },
];

function loadChecklistState() {
  if (typeof window === "undefined") return DEFAULT_CHECKLIST_ITEMS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CHECKLIST_ITEMS;
  } catch {
    return DEFAULT_CHECKLIST_ITEMS;
  }
}

function saveChecklistState(items: typeof DEFAULT_CHECKLIST_ITEMS) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export function OnboardingChecklist() {
  const router = useRouter();
  const [items, setItems] = useState<typeof DEFAULT_CHECKLIST_ITEMS>(() => loadChecklistState());
  const [isLoggedIn] = useState(() => getSession() !== null);

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;
  const isComplete = completedCount === items.length;

  function toggleItem(id: number) {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setItems(newItems);
    saveChecklistState(newItems);

    const item = newItems.find((i) => i.id === id);
    if (item?.completed) {
      trackEvent("onboarding_checklist_item_completed", { item_id: id });
    }
  }

  function handleGetStarted() {
    trackEvent("onboarding_checklist_completed", { items_count: items.length });
    router.push("/pricing");
  }

  return (
    <div className="checklist-card rounded-[28px] border border-border/80 bg-card/80 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">🎯 Your First Book</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {completedCount}/{items.length}
            </span>
            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {isComplete
            ? "Congratulations! Your first book is ready!"
            : isLoggedIn
              ? "İlerlemeni takip et"
              : "Track your progress and link to your account"}
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-all",
              item.completed
                ? "border-primary/30 bg-primary/8"
                : "border-border/60 bg-background/60 hover:border-primary/20 hover:bg-accent/50",
            )}
          >
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                item.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground group-hover:border-primary/40",
              )}
            >
              {item.completed ? <Check className="size-3" /> : <div className="size-2 rounded-full bg-current" />}
            </div>
            <span
              className={cn(
                "flex-1 text-sm",
                item.completed ? "text-foreground line-through opacity-60" : "text-foreground",
              )}
            >
              {item.text}
            </span>
            <ChevronRight
              className={cn(
                "size-4 shrink-0 transition-all",
                item.completed ? "opacity-40" : "opacity-0 group-hover:opacity-40",
              )}
            />
          </button>
        ))}
      </div>

      {isComplete ? (
        <div className="mt-4 rounded-[20px] border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎉</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Congratulations! Your first book is ready!</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Now continue with the full book and export features.
              </p>
              <Button size="sm" className="mt-3" onClick={handleGetStarted}>
                Premium&apos;a Geç
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-border/60 bg-background/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {completedCount > 0 ? (
              <>Great! You completed {completedCount} steps. Keep going!</>
            ) : (
              <>Start the wizard to take your first step.</>
            )}
          </p>
        </div>
      )}

      <button
        onClick={() => {
          setItems(DEFAULT_CHECKLIST_ITEMS);
          saveChecklistState(DEFAULT_CHECKLIST_ITEMS);
        }}
        className="mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Sıfırla
      </button>
    </div>
  );
}