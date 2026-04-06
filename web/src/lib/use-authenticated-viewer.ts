"use client";

import { useEffect, useState } from "react";

import {
  getViewer,
  syncPreviewAuthState,
  type PreviewViewer,
} from "@/lib/preview-auth";

export function useAuthenticatedViewer(enabled = true) {
  const [viewer, setViewer] = useState<PreviewViewer | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const cachedViewer = getViewer();
    if (cachedViewer) {
      setViewer(cachedViewer);
    }

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      setViewer(payload?.viewer || getViewer());
    });

    return () => {
      active = false;
    };
  }, [enabled]);

  async function refreshViewer() {
    const payload = await syncPreviewAuthState();
    const nextViewer = payload?.viewer || getViewer();
    setViewer(nextViewer);
    return nextViewer;
  }

  return {
    viewer,
    setViewer,
    refreshViewer,
  };
}
