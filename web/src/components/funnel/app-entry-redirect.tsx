"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "@/lib/preview-auth";

export function AppEntryRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (getSession()) {
      router.replace("/app/library");
      return;
    }
    router.replace("/start/topic");
  }, [router]);

  return null;
}
