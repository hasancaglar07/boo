import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Privacy Policy | Data Usage",
  description:
    "Review the Book Generator privacy policy. Learn about account data, content data, API keys, and data processing principles with third-party services.",
  path: "/privacy",
  keywords: ["privacy policy", "book generator data usage", "ai content security"],
});

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Privacy</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Privacy policy</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          This product processes account, settings, and output data required during the book production process in the most limited way possible.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {[
            ["Account data", "Basic information such as name, email, plan, and usage flow may be retained for the account experience."],
            ["Content data", "Book briefs, chapter contents, metadata, and export files are part of the book production process."],
            ["API keys", "Keys are only used in relevant workflows when saved by the user."],
            ["Third-party providers", "When AI or output providers are used, the respective provider's own terms also apply."],
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
