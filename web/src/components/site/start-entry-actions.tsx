"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

export function StartEntryActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link
          href="/start/topic"
          onClick={() => trackEvent("start_page_completion", { path: "start_topic" })}
        >
          Start now
        </Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="/examples">Browse example outputs</Link>
      </Button>
      <Button variant="ghost" size="lg" asChild>
        <Link href="/pricing">View premium plans</Link>
      </Button>
    </div>
  );
}
