"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "book-generator:cookie-consent";

function getStoredConsent(): "granted" | "denied" | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "granted" || val === "denied") return val;
  } catch {
    // no-op
  }
  return null;
}

function applyConsent(state: "granted" | "denied") {
  const win = window as Window & { gtag?: (...args: unknown[]) => void };
  if (typeof win.gtag === "function") {
    win.gtag("consent", "update", {
      analytics_storage: state,
      ad_storage: state,
    });
  }
  try {
    localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // no-op
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    applyConsent("granted");
    setVisible(false);
  }

  function decline() {
    applyConsent("denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm sm:left-auto sm:right-6 sm:max-w-sm">
      <p className="text-sm leading-6 text-muted-foreground">
        Deneyimi iyileştirmek için analitik çerezler kullanıyoruz. Kabul etmezsen yalnızca zorunlu çerezler aktif olur.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={accept} className="flex-1">
          Kabul et
        </Button>
        <Button size="sm" variant="outline" onClick={decline} className="flex-1">
          Reddet
        </Button>
      </div>
    </div>
  );
}
