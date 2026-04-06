import { KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const pricingNotes = [
  {
    title: "Low-risk book unlocking for $4",
    text: "The Single Book pack is a clear and simple entry point for those who want to unlock a full book without a subscription. EPUB and PDF included.",
  },
  {
    title: "Preview first, pay later",
    text: "The pricing discussion happens not on the payment page, but gains meaning after the user sees the preview. Payment wall resistance drops.",
  },
  {
    title: "Guarantee and cost transparency",
    text: `${KDP_GUARANTEE_CLAIM} ve ${NO_API_COST_CLAIM.toLowerCase()} , pricing is clear and straightforward. No hidden fees.`,
  },
] as const;

export function HomePricingTestimonials() {
  return (
    <section className="border-b border-border/80 py-10">
      <div className="shell">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Three things you should know before learning about pricing:
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {pricingNotes.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-[28px] border border-primary/15 bg-primary/5 px-5 py-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}