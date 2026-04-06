"use client";

import { LockKeyhole } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { AuthForm } from "@/components/forms/auth-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type GateMode = "login" | "register";
type GateMethod = "google" | "magic" | "credentials";

export function GenerateAuthGateDialog({
  open,
  onOpenChange,
  resumePath,
  onAuthenticated,
  onMethodSelected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumePath: string;
  onAuthenticated: (input: { method: "credentials"; mode: GateMode }) => Promise<void> | void;
  onMethodSelected?: (input: { method: GateMethod; mode: GateMode }) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [mode, setMode] = useState<GateMode>("register");
  const [busy, setBusy] = useState(false);
  const dialogKey = useMemo(() => (open ? "generate-gate-open" : "generate-gate-closed"), [open]);

  useEffect(() => {
    if (open) {
      trackEvent("signup_prompt_shown", { source: "generate_gate" });
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!busy) {
          onOpenChange(nextOpen);
        }
      }}
      dismissible={!busy}
      closeOnOverlay={false}
      closeOnEscape={!busy}
      labelledBy={titleId}
      describedBy={descriptionId}
      panelClassName="max-w-[min(580px,calc(100vw-24px))]"
    >
      <DialogContent className="overflow-hidden rounded-[26px] border-[#d8bfac]/60 bg-[linear-gradient(180deg,#fffaf4_0%,#fff7ef_100%)] p-5 shadow-[0_32px_72px_rgba(45,21,10,0.18)] sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e4d1c1] bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f5a46]">
          <LockKeyhole className="size-3.5" />
          Ön İzlemeyi Kaydet
        </div>

        <h2 id={titleId} className="mt-4 text-2xl font-semibold tracking-tight text-[#2f1f17] sm:text-[30px]">
          Hazırlanan kitabı
          <br />
          hesabına kaydedelim
        </h2>

        <p id={descriptionId} className="mt-3 text-sm leading-7 text-[#6f5547]">
          Bu adım ödeme istemez. Ön izleme hazırlanırken kitabının kaybolmaması ve hazır olduğunda kütüphanende görünmesi için hesabını oluşturuyoruz.
        </p>

        <div className="mt-5 inline-flex rounded-[16px] border border-[#dcc1ae]/80 bg-white/88 p-1">
          {[
            { value: "register" as const, label: "Create Account" },
            { value: "login" as const, label: "Giriş Yap" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "rounded-[14px] px-4 py-2 text-sm font-medium transition",
                mode === item.value
                  ? "bg-[#3f2a1f] text-white shadow-[0_10px_20px_rgba(63,42,31,0.14)]"
                  : "text-[#704d3b] hover:bg-[#f2e4d7]",
              )}
              onClick={() => setMode(item.value)}
              disabled={busy}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[22px] border border-[#e4d1c1] bg-white/92 p-4 shadow-[0_18px_40px_rgba(92,58,40,0.05)] sm:p-5">
          <AuthForm
            key={dialogKey}
            mode={mode}
            variant="modal"
            showHeader={false}
            redirectIfAuthenticated={false}
            next={resumePath}
            source="generate_gate"
            onBusyChange={setBusy}
            onSuccess={onAuthenticated}
            onMethodSelected={onMethodSelected}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs leading-6 text-[#8b6a59]">
            We don't require payment. Once you sign in, the preview starts and you continue on the same account.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Vazgeç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
