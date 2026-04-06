import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Terms of Use | Service Terms",
  description:
    "Read the Book Generator terms of use. Review the service scope, user responsibilities, plan limits, and key conditions applicable to publishing processes.",
  path: "/terms",
  keywords: ["terms of use", "book generator terms", "service agreement"],
});

export default function TermsPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Terms</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Terms of use</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          The product provides tools to accelerate your book production; the publishing decision and final quality responsibility remain with the user.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["Service scope", "The tool provides production assistants such as outline, chapter generation, research, and output workflows."],
            ["User responsibility", "Content accuracy, rights compliance, publishing decisions, and platform compatibility must be verified by the user."],
            ["Plans and limits", "Usage rights are defined per plan, renewed monthly, and apply to a single account."],
          ].map(([title, text]) => (
            <Card key={title}>
              <CardContent>
                <h2 className="text-lg font-medium text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
