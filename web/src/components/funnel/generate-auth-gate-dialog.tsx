"use client";

import { Check, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useId, useState } from "react";

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

  useEffect(() => {
    if (open) {
      setMode("register");
      setBusy(false);
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
      panelClassName="max-w-[min(920px,calc(100vw-24px))]"
    >
      <DialogContent className="overflow-hidden rounded-[30px] border-[#c79d84]/40 bg-[#f7efe3] p-0 shadow-[0_36px_80px_rgba(45,21,10,0.24)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="bg-[linear-gradient(180deg,#4b2f22_0%,#6b422f_56%,#8d573d_100%)] px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/82">
              <LockKeyhole className="size-3.5" />
              Üyelik Gerekli
            </div>

            <h2 id={titleId} className="mt-5 text-[30px] font-semibold leading-[1.05] tracking-[-0.03em]">
              Kitabını hesabına
              <br />
              güvenle kaydet
            </h2>

            <p id={descriptionId} className="mt-4 max-w-sm text-sm leading-7 text-white/78">
              Önizleme üretimi başlamadan önce hesabını oluşturuyoruz. Böylece hazırlanan kitap doğrudan senin kütüphanene düşer ve sonradan aynı yerden devam edersin.
            </p>

            <div className="mt-6 space-y-3">
              {[
                "Kitabın hesabına kaydolur",
                "Hazır olduğunda kütüphanende görünür",
                "Aynı cihazdan veya mail linkinden devam edersin",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[18px] border border-white/14 bg-white/8 px-4 py-3">
                  <div className="mt-0.5 rounded-full bg-white/14 p-1">
                    <Check className="size-3.5" />
                  </div>
                  <div className="text-sm leading-6 text-white/88">{item}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[20px] border border-white/12 bg-black/12 px-4 py-4 text-sm leading-7 text-white/74">
              Ödeme istemiyoruz. Bu adım yalnızca oluşturulan kitabı doğru hesaba bağlamak için var.
            </div>
          </div>

          <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.64)_0%,rgba(255,252,247,0.92)_18%,#fffaf3_100%)] px-5 py-5 sm:px-7 sm:py-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#91634d]">
                  Book Generator
                </div>
                <div className="mt-2 text-lg font-semibold text-[#3a2418]">
                  Hesabını oluştur ve kitabını başlat
                </div>
              </div>
              <Sparkles className="size-5 text-[#a15e3a]" />
            </div>

            <div className="mt-5 inline-flex rounded-[18px] border border-[#d8b9a4]/70 bg-white/75 p-1 shadow-[0_8px_20px_rgba(75,47,34,0.08)]">
              {[
                { value: "register" as const, label: "Hesap Oluştur" },
                { value: "login" as const, label: "Giriş Yap" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "rounded-[14px] px-4 py-2 text-sm font-medium transition",
                    mode === item.value
                      ? "bg-[#3f2a1f] text-white shadow-[0_12px_24px_rgba(63,42,31,0.18)]"
                      : "text-[#704d3b] hover:bg-[#f2e4d7]",
                  )}
                  onClick={() => setMode(item.value)}
                  disabled={busy}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-[#e4d1c1] bg-white/82 p-5 shadow-[0_20px_50px_rgba(92,58,40,0.08)]">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#8b614a]">
                <span className="rounded-full border border-[#e3c8b5] bg-[#fff7ef] px-3 py-1">Ödeme istemiyoruz</span>
                <span className="rounded-full border border-[#e3c8b5] bg-[#fff7ef] px-3 py-1">Kitap hesabına yazılır</span>
                <span className="rounded-full border border-[#e3c8b5] bg-[#fff7ef] px-3 py-1">Hazır olunca kütüphanende</span>
              </div>

              <AuthForm
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
                Kitap auth tamamlandıktan sonra otomatik olarak hazırlanır.
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
