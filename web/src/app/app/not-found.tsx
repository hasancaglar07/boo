import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-2xl rounded-[30px] border border-border/80 bg-card/80 p-8 text-center sm:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          This workspace was not found
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          The book may have been deleted or the link may be incorrect. You can safely return to the app home screen.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/app/library">Return to app home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/new/topic">Start your first book</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
