import type { Metadata } from "next";

import { ContactPageHero } from "@/components/site/page-heroes";
import { ContactForm } from "@/components/site/contact-form";
import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supportChannels } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Contact | Support and Billing",
  description:
    "Find Book Generator support, technical help, account access, and billing request channels on a single page and get a quick response.",
  path: "/contact",
  keywords: ["book generator contact", "book writing support", "billing support"],
});

export default function ContactPage() {
  return (
    <MarketingPage>
      <ContactPageHero />

      {/* Support channels strip */}
      <section className="border-b border-border/80 bg-accent/20 py-8">
        <div className="shell grid gap-4 md:grid-cols-3">
          {supportChannels.map((channel) => (
            <Card key={channel.title}>
              <CardContent className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{channel.title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">{channel.text}</p>
                <p className="text-sm font-medium text-primary">{channel.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Form + heading */}
      <section className="shell py-12">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "General response time", text: "We aim to respond to most messages within the same business day." },
            { title: "For fastest resolution", text: "Share your book slug, preview link, or screenshot." },
            { title: "Subject selection matters", text: "Choosing the right subject for billing, access, and technical support speeds up the process." },
          ].map(({ title, text }) => (
            <Card key={title}>
              <CardContent className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mb-8">
          <Badge>Contact</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Tell us where you're stuck. We'll sort it out quickly.
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Be specific with your subject so the right team can respond faster.
          </p>
        </div>
        <ContactForm />
      </section>
    </MarketingPage>
  );
}
