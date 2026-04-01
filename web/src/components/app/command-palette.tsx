"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PaletteAction = {
  label: string;
  description: string;
  run: () => void | Promise<void>;
};

export function CommandPalette({ actions }: { actions: PaletteAction[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (action) =>
        action.label.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q),
    );
  }, [actions, query]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm">
          Komut Paleti
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[min(720px,calc(100vw-32px))] -translate-x-1/2 rounded-[28px] border border-border bg-card p-4 shadow-xl outline-none">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3">
            <Search className="size-4 text-muted-foreground" />
            <Input
              className="border-0 bg-transparent px-0 focus:bg-transparent"
              placeholder="Komut ara"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
            {filtered.map((action) => (
              <button
                key={action.label}
                className={cn(
                  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-left transition hover:bg-accent",
                )}
                onClick={async () => {
                  await action.run();
                  setOpen(false);
                }}
              >
                <div className="text-sm font-medium text-foreground">{action.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{action.description}</div>
              </button>
            ))}
            {!filtered.length ? (
              <div className="rounded-2xl border border-border bg-background px-4 py-6 text-sm text-muted-foreground">
                Sonuç bulunamadı.
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
