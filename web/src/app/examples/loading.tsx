import { MarketingPage } from "@/components/site/marketing-page";

export default function ExamplesLoading() {
  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-10 md:py-14">
        <div className="shell">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-2xl bg-muted md:w-3/4" />
            <div className="h-5 w-full animate-pulse rounded-xl bg-muted/70 md:w-2/3" />
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="shell grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[24px] border border-border/80 bg-card p-5">
              <div className="h-36 animate-pulse rounded-xl bg-muted" />
              <div className="mt-4 h-5 w-3/4 animate-pulse rounded-lg bg-muted" />
              <div className="mt-2 h-4 w-full animate-pulse rounded-lg bg-muted/70" />
              <div className="mt-1 h-4 w-5/6 animate-pulse rounded-lg bg-muted/70" />
            </div>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
