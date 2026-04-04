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
  const appRoute = Boolean(pathname?.startsWith("/app"));
  const [session, setSession] = useState<PreviewSession | null>(() => getSession());
  const [status, setStatus] = useState<"pending" | "authenticated" | "unauthenticated">(() => (
    getSession() ? "authenticated" : "pending"
  ));

  useEffect(() => {
    let active = true;

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      const nextSession = getSession();
      setSession(nextSession);

      if (payload) {
        setStatus(payload.authenticated ? "authenticated" : "unauthenticated");
        return;
      }

      if (nextSession) {
        setStatus("authenticated");
        return;
      }

      // /app routes are server-protected; if auth state sync fails, avoid false logout redirects.
      setStatus(appRoute ? "authenticated" : "unauthenticated");
    });

    return () => {
      active = false;
    };
  }, [appRoute]);

  useEffect(() => {
    if (status !== "unauthenticated" || session !== null) return;
    const separator = redirectBase.includes("?") ? "&" : "?";
    router.replace(`${redirectBase}${separator}next=${encodeURIComponent(pathname || "/app")}`);
  }, [pathname, redirectBase, router, session, status]);

  if (status === "pending") {
    return false;
  }

  if (status === "unauthenticated" && session === null) {
    return false;
  }

  return true;
}
