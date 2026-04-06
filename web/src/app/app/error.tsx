"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-2xl rounded-[30px] border border-border/80 bg-card/80 p-8 sm:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Application error</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">Workspace could not be loaded</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          The process was interrupted. You can try again or safely continue from the new book flow within the app.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/app/new/topic">Return to new book flow</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/app/library">App home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
