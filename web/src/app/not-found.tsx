import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <main className="shell flex min-h-[70vh] items-center justify-center py-20">
      <div className="w-full max-w-2xl rounded-[30px] border border-border/80 bg-card/80 p-8 text-center sm:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground">
          Aradigin sayfayi bulamadik
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          Guvenli baslangic noktalarindan birine donerek akisa devam edebilirsin.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/start/topic">Ilk kitabini baslat</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Ana sayfaya don</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
