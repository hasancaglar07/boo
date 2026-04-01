"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { syncPreviewAuthState } from "@/lib/preview-auth";

export function AuthStateHydrator() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const payload = await syncPreviewAuthState();
      if (!active || !payload?.authenticated || !payload.session?.userId || !payload.anonymousId) {
        return;
      }

      if (typeof window === "undefined") {
        return;
      }

      const claimKey = `book-guest-claim:${payload.session.userId}:${payload.anonymousId}`;
      if (window.sessionStorage.getItem(claimKey)) {
        return;
      }

      const response = await fetch("/api/auth/claim-guest-books", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);

      if (!active) {
        return;
      }

      if (response?.ok) {
        window.sessionStorage.setItem(claimKey, "1");
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [pathname]);

  return null;
}
