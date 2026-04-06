import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { buildPageMetadata } from "@/lib/seo";
import { StartOptionCards } from "@/components/site/start-option-cards";

export const metadata: Metadata = buildPageMetadata({
  title: "Start Your Book | Book Generator",
  description: "Write your topic and get a preview of your book in minutes. Start for free, no credit card required.",
  path: "/start",
  noIndex: true,
});

export default function StartPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mb-12">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Book Generator
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
          Write your topic. Start your book.
        </h1>
        <p className="text-lg text-muted-foreground">
          The best first step is the wizard. Answer 5 quick questions and the system guides you — your chapter plan and first preview appear in no time.
        </p>
      </div>


      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="rounded-full border border-border/80 bg-card px-3 py-1">Recommended path: wizard</span>
        <span className="rounded-full border border-border/80 bg-card px-3 py-1">About 2 minutes</span>
        <span className="rounded-full border border-border/80 bg-card px-3 py-1">Preview first, decide later</span>
      </div>
      {/* 3-Option Cards */}
      <StartOptionCards />

      {/* Trust signals */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          See a free preview first
        </span>
        <span className="hidden sm:inline text-border">•</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          No credit card required
        </span>
        <span className="hidden sm:inline text-border">•</span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          Start in 5 questions
        </span>
      </div>

      {/* Secondary link */}
      <div className="mt-8 text-sm text-muted-foreground">
        How does it work?{" "}
        <Link href="/how-it-works" className="underline underline-offset-4 hover:text-foreground transition-colors">
          See step by step <ArrowRight className="inline h-3 w-3" />
        </Link>
      </div>
    </main>
  );
}
