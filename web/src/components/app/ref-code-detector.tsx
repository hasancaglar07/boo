"use client";

import { useEffect } from "react";

export function RefCodeDetector() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;

    const code = ref.trim().toUpperCase();
    localStorage.setItem("ref_code", code);

    fetch("/api/referral/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      // fire-and-forget, silently ignore errors
    });
  }, []);

  return null;
}
