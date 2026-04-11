import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export function MarketingPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="h-[72px] shrink-0" aria-hidden="true" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
