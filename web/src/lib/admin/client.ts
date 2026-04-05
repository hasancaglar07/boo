"use client";

import { useCallback, useEffect, useState } from "react";

type AdminFetchOptions = RequestInit & {
  allowErrorPayload?: boolean;
};

export async function adminFetch<T>(path: string, init?: AdminFetchOptions) {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as T & {
    error?: string;
  };

  if (!response.ok && !init?.allowErrorPayload) {
    throw new Error(payload?.error || "Admin isteği başarısız.");
  }

  return payload;
}

export function useAdminResource<T>(
  path: string,
  options?: { intervalMs?: number; allowErrorPayload?: boolean },
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await adminFetch<T>(path, {
        allowErrorPayload: options?.allowErrorPayload,
      });
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [options?.allowErrorPayload, path]);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const payload = await adminFetch<T>(path, {
          allowErrorPayload: options?.allowErrorPayload,
        });
        if (!active) return;
        setData(payload);
        setError("");
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Yüklenemedi.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    void run();

    if (!options?.intervalMs) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void run();
    }, options.intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void run();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [options?.allowErrorPayload, options?.intervalMs, path]);

  return { data, loading, error, reload };
}
