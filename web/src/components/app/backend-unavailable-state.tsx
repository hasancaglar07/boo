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
            Service is currently unavailable
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Unable to connect to the application backend service. You can try again shortly or
            return to the new book flow within the app.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onRetry}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/app/new/topic">Return to new book flow</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
