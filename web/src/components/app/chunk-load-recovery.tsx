"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "book-generator:chunk-load-retry";
const RELOAD_GUARD_WINDOW_MS = 30_000;

function errorMessage(input: unknown) {
  if (input instanceof Error) {
    return input.message;
  }
  if (typeof input === "string") {
    return input;
  }
  if (input && typeof input === "object" && "message" in input) {
    const message = (input as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

function shouldRecoverFromChunkError(input: unknown) {
  const message = errorMessage(input);
  if (
    message.includes("ChunkLoadError") ||
    message.includes("Failed to load chunk") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Refused to apply style") ||
    message.includes("MIME type")
  ) {
    return true;
  }

  return message.includes("/_next/static/");
}

function canReloadNow() {
  if (typeof window === "undefined") {
    return false;
  }

  const now = Date.now();
  const raw = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
  if (!raw) {
    return true;
  }

  const lastAttempt = Number(raw);
  if (Number.isNaN(lastAttempt)) {
    return true;
  }

  return now - lastAttempt > RELOAD_GUARD_WINDOW_MS;
}

function reloadForFreshChunks() {
  if (typeof window === "undefined" || !canReloadNow()) {
    return;
  }

  window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  window.location.reload();
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    function onError(event: Event) {
      const scriptTarget = event.target as HTMLScriptElement | null;
      if (scriptTarget?.tagName === "SCRIPT" && scriptTarget.src.includes("/_next/static/")) {
        reloadForFreshChunks();
        return;
      }

      const linkTarget = event.target as HTMLLinkElement | null;
      if (
        linkTarget?.tagName === "LINK" &&
        linkTarget.rel === "stylesheet" &&
        linkTarget.href.includes("/_next/static/")
      ) {
        reloadForFreshChunks();
        return;
      }

      if (event instanceof ErrorEvent && shouldRecoverFromChunkError(event.error || event.message)) {
        reloadForFreshChunks();
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (shouldRecoverFromChunkError(event.reason)) {
        reloadForFreshChunks();
      }
    }

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
