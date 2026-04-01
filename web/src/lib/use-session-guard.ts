"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession, syncPreviewAuthState, type PreviewSession } from "@/lib/preview-auth";

export function useSessionGuard() {
  return useSessionGuardWithRedirect();
}

export function useSessionGuardWithRedirect(redirectBase = "/login") {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<PreviewSession | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void syncPreviewAuthState().then(() => {
      if (!active) return;
      setSession(getSession());
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session === null) {
      const separator = redirectBase.includes("?") ? "&" : "?";
      router.replace(`${redirectBase}${separator}next=${encodeURIComponent(pathname || "/app")}`);
    }
  }, [pathname, redirectBase, router, session]);

  return session !== undefined && Boolean(session);
}
