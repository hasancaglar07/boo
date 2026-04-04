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
    <html lang="tr">
      <body className="min-h-screen bg-background text-foreground">
        <main className="shell flex min-h-screen items-center justify-center py-20">
          <div className="w-full max-w-2xl rounded-[30px] border border-border/80 bg-card/80 p-8 sm:p-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Sistem hatası
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
              Uygulama beklenmedik şekilde durdu
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Sayfayı yeniden dene veya güvenli başlangıç noktasına dön.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={reset}>Tekrar dene</Button>
              <Button variant="outline" asChild>
                <Link href="/start/topic">Başlangıç ekranı</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
