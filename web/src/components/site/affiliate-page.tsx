"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Copy, LinkIcon, BadgeDollarSign, CheckCircle2, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const COMMISSIONS = [
  { plan: "Starter", price: "$19", perMonth: "$5.70", total3: "$17.10" },
  { plan: "Creator", price: "$39", perMonth: "$11.70", total3: "$35.10" },
  { plan: "Pro", price: "$79", perMonth: "$23.70", total3: "$71.10" },
];

const STEPS = [
  {
    icon: Users,
    title: "Sign up for free",
    desc: "Sign up for BookGenerator.net. Your account automatically receives an affiliate link — no extra application required.",
  },
  {
    icon: LinkIcon,
    title: "Share your affiliate link",
    desc: "Copy your special link from your profile and share it on social media, blogs, email, or WhatsApp.",
  },
  {
    icon: BadgeDollarSign,
    title: "Earn 30% from every payment",
    desc: "Earn a permanent 30% commission from everyone who signs up through your link and makes a payment. No limit.",
  },
];

const FAQS = [
  {
    q: "Do I need to apply?",
    a: "No! Your affiliate link is automatically created as soon as you register. You can access it immediately from your profile settings or the /affiliate page.",
  },
  {
    q: "What is the commission rate?",
    a: "You earn a 30% commission from every active subscription payment. This repeats every month as long as the subscription is active.",
  },
  {
    q: "Is the Premium plan ($4) included in commissions?",
    a: "No. Affiliate commissions only apply to monthly subscription plans (Starter, Creator, Pro).",
  },
  {
    q: "How are payments made?",
    a: "Payments are made via PayPal or bank transfer. Minimum payout threshold is $50. Payments are processed monthly.",
  },
  {
    q: "When is the commission approved?",
    a: "After the 30-day refund period expires, the commission is approved and added to your balance.",
  },
  {
    q: "How many people can I invite?",
    a: "No limit. The more you share, the more you earn. Every paying member you invite brings a 30% commission.",
  },
  {
    q: "Is it mandatory for my invitee to use my link?",
    a: "Yes. The affiliate system requires members to sign up through your special link. Your link carries the ?ref=YOURCODE parameter and is automatically recognized.",
  },
];

function LoggedInAffiliateCard() {
  const [data, setData] = useState<{ referralUrl: string; clicks: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData({ referralUrl: json.referralUrl, clicks: json.clicks });
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => null);
    setCopied(true);
    trackEvent("affiliate_link_copied", { source: "affiliate_page_loggedin" });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!data) return;
    trackEvent("affiliate_whatsapp_clicked", { source: "affiliate_page_loggedin" });
    const text = `Write a professional book in minutes with BookGenerator.net! ${data.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!data) return;
    trackEvent("affiliate_twitter_clicked", { source: "affiliate_page_loggedin" });
    const text = `I wrote a book in minutes with AI 🚀 Try BookGenerator.net:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`, "_blank");
  }

  return (
    <section className="border-b border-border/80 py-18">
      <div className="shell">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Your affiliate account is active
            </span>
          </div>

          <div className="rounded-[28px] border border-border/80 bg-card/80 px-6 py-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-primary">
                <LinkIcon className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Your Affiliate Link</h3>
                <p className="text-xs text-muted-foreground">Copy, share — earn 30% from every payment</p>
              </div>
            </div>

            {loading ? (
              <div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />
            ) : (
              <div
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={handleCopy}
              >
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground select-all">
                  {data?.referralUrl || "Loading..."}
                </span>
                <Copy className="size-4 shrink-0 text-muted-foreground" />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="min-h-[40px]" onClick={handleCopy} disabled={!data}>
                {copied ? (
                  <><CheckCircle2 className="mr-1.5 size-3.5" /> Copied!</>
                ) : (
                  <><Copy className="mr-1.5 size-3.5" /> Copy Link</>
                )}
              </Button>
              <Button size="sm" variant="outline" className="min-h-[40px]" onClick={handleWhatsApp} disabled={!data}>
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="min-h-[40px]" onClick={handleTwitter} disabled={!data}>
                X (Twitter)
              </Button>
            </div>

            {data && data.clicks > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                <Users className="inline size-3 mr-1" />
                <strong className="text-foreground">{data.clicks}</strong> people clicked your link
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/app/affiliate"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/14"
            >
              <BadgeDollarSign className="size-3.5" />
              Open detailed affiliate panel
              <span className="text-muted-foreground">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {q}
        {open ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export function AffiliatePage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/referral/my-code")
      .then((r) => {
        if (r.ok) setIsLoggedIn(true);
        else setIsLoggedIn(false);
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* Show direct URL to logged-in user */}
      {isLoggedIn === true && <LoggedInAffiliateCard />}

      {/* Hero */}
      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center rounded-full border border-border/80 bg-card/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Affiliate Program
            </div>

            <h1 className="mx-auto mt-8 max-w-3xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Earn 30% Commission from Every Membership
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
              Everyone who signs up for BookGenerator.net automatically receives an affiliate link. 
              Share your link, earn a permanent 30% commission from every paying invitee.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="size-3 text-emerald-500" />
                No application required
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Zap className="size-3 text-primary" />
                Instant affiliate link
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                <BadgeDollarSign className="size-3 text-primary" />
                Permanent 30% commission
              </span>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {isLoggedIn === true ? (
                <>
                  <Button asChild size="lg" className="px-8">
                    <Link href="/app/affiliate">
                      <BadgeDollarSign className="mr-2 size-4" />
                      Open Affiliate Panel
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="px-8">
                    <Link href="/app/library">Back to My Books</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="px-8">
                    <Link href="/register">
                      <Users className="mr-2 size-4" />
                      Sign Up Free
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="px-8">
                    <a href="#nasil-calisir">How It Works?</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="nasil-calisir" className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="How It Works?"
            title="Earn 30% Commission in 3 Steps"
            description="Sign up, share your link, earnings are calculated automatically. No extra tools or application required."
            align="center"
          />

          <div className="relative mt-12">
            <div className="absolute left-0 right-0 top-10 hidden border-t border-dashed border-border/60 lg:block" />

            <div className="grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={i} className="relative rounded-[28px] border border-border/80 bg-card/80 px-6 pb-6 pt-5 shadow-sm">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                    {i + 1}
                    <span className="absolute -top-[23px] left-1/2 hidden h-2 w-2 -translate-x-1/2 rounded-full bg-primary lg:block" />
                  </div>

                  <p className="mt-3 font-serif text-5xl font-semibold leading-none text-primary/12 select-none">
                    {i + 1}
                  </p>

                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Commission table */}
      <section className="border-b border-border/80 py-18">
        <div className="shell max-w-2xl">
          <SectionHeading
            badge="Commission Table"
            title="30% for Every Plan"
            description="You earn commission every month as long as the person you invited continues their payment."
            align="center"
          />

          <div className="mt-8 rounded-[28px] border border-border/80 bg-card/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50">
                    <th className="px-5 py-3 text-left font-semibold text-foreground">Plan</th>
                    <th className="px-5 py-3 text-right font-semibold text-foreground">Monthly</th>
                    <th className="px-5 py-3 text-right font-semibold text-foreground">Commission/Month</th>
                    <th className="px-5 py-3 text-right font-semibold text-primary">3 Ay</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMISSIONS.map((row, i) => (
                    <tr key={i} className={cn("border-b border-border/40 last:border-0", i % 2 === 1 && "bg-muted/20")}>
                      <td className="px-5 py-4 font-medium text-foreground">{row.plan}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{row.price}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{row.perMonth}</td>
                      <td className="px-5 py-4 text-right font-semibold text-primary">{row.total3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/40 bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
              Premium ($4 one-time) is outside commission scope. Approved after the 30-day refund period.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border/80 py-18">
        <div className="shell max-w-2xl">
          <SectionHeading
            badge="SSS"
            title="Frequently Asked Questions"
            align="center"
          />

          <div className="mt-8 rounded-[28px] border border-border/80 bg-card/80 shadow-sm">
            <div className="divide-y divide-border/60 p-6">
              {FAQS.map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-18 text-center">
        <div className="shell max-w-xl">
          <SectionHeading
            title={isLoggedIn === true ? "Go to Affiliate Panel" : "Start Now"}
            description={
              isLoggedIn === true
                ? "You can copy your link and track commissions from the detailed affiliate panel."
                : "Sign up, get your affiliate link, and start sharing. Earn a permanent 30% commission from every paying member."
            }
            align="center"
          />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isLoggedIn === true ? (
              <Button asChild size="lg" className="px-8">
                <Link href="/app/affiliate">
                  <BadgeDollarSign className="mr-2 size-4" />
                  Open Affiliate Panel
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="px-8">
                  <Link href="/register">
                    <Users className="mr-2 size-4" />
                    Sign Up Free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8">
                  <a href="mailto:affiliate@bookgenerator.net?subject=Affiliate%20Question">Ask a Question</a>
                </Button>
              </>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground/70">
            affiliate@bookgenerator.net · Questions are answered within 2 business days
          </p>
        </div>
      </section>
    </div>
  );
}
