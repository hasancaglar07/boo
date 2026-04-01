"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BackendUnavailableState({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Servise şu an ulaşılamıyor
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Uygulama backend servisine bağlanamadı. Kısa süre sonra tekrar deneyebilir veya güvenli
            başlangıç ekranına dönebilirsin.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onRetry}>Yeniden dene</Button>
          <Button variant="outline" asChild>
            <Link href="/start/topic">Başlangıç ekranına dön</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/how-it-works">Nasıl çalıştığını incele</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
