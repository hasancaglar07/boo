"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="shell flex min-h-screen items-center justify-center py-20">
          <div className="w-full max-w-2xl rounded-[30px] border border-border/80 bg-card/80 p-8 sm:p-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              System error
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
              The application stopped unexpectedly
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Retry the page or return to the safe starting point.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" asChild>
                <Link href="/start/topic">Start your first book</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
