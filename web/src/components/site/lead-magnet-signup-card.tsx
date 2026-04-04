"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackEvent, trackEventOnce } from "@/lib/analytics";
import type { LeadMagnetDefinition } from "@/lib/lead-magnets";

export function LeadMagnetSignupCard({ leadMagnet }: { leadMagnet: LeadMagnetDefinition }) {
  const [email, setEmail] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [pending, setPending] = useState(false);
  const [deliveredTo, setDeliveredTo] = useState("");
  const [error, setError] = useState("");
  const captureViewedRef = useRef(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const success = Boolean(deliveredTo);

  useEffect(() => {
    trackEventOnce(
      "lead_magnet_viewed",
      { leadMagnet: leadMagnet.slug },
      { key: `lead-magnet-viewed:${leadMagnet.slug}` },
    );
  }, [leadMagnet.slug]);

  function trackCaptureViewed() {
    if (captureViewedRef.current) return;
    captureViewedRef.current = true;
    trackEvent("lead_magnet_email_capture_viewed", { leadMagnet: leadMagnet.slug });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    setError("");
    trackCaptureViewed();

    if (!emailValid) {
      return;
    }

    setPending(true);

    try {
      trackEvent("lead_magnet_requested", { leadMagnet: leadMagnet.slug });

      const response = await fetch("/api/resources/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          leadMagnetSlug: leadMagnet.slug,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Paket şu anda gönderilemedi.");
      }

      setDeliveredTo(email.trim());
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Paket şu anda gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      id="lead-magnet-capture"
      className="rounded-[32px] border border-primary/20 bg-[linear-gradient(135deg,rgba(188,104,67,0.08),rgba(255,255,255,0.78))] p-6 shadow-[0_20px_50px_rgba(36,22,14,0.08)] md:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
        <div className="max-w-2xl">
          <Badge className="mb-4">{leadMagnet.badge}</Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{leadMagnet.title}</h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">{leadMagnet.description}</p>

          <div className="mt-8 rounded-[28px] border border-border/80 bg-background/80 p-5">
            <p className="text-sm font-semibold text-foreground">Bu pakette:</p>
            <ul className="mt-4 space-y-3">
              {leadMagnet.previewHighlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {leadMagnet.trustPoints.map((point) => (
              <div key={point} className="rounded-full border border-border/80 bg-background/72 px-4 py-2 text-xs font-medium text-muted-foreground">
                {point}
              </div>
            ))}
          </div>
        </div>

        <Card className="border border-border/80 bg-background/92">
          <CardContent className="p-6 md:p-7">
            {!success ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{leadMagnet.formTitle}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{leadMagnet.formDescription}</p>
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="lead-magnet-email" className="text-sm font-medium text-foreground">
                      E-posta
                    </label>
                    <Input
                      id="lead-magnet-email"
                      type="email"
                      value={email}
                      onFocus={trackCaptureViewed}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {showValidation && !emailValid ? (
                      <p className="text-sm text-primary">Geçerli bir e-posta girmen gerekiyor.</p>
                    ) : null}
                  </div>

                  <Button type="submit" size="lg" className="w-full gap-2" isLoading={pending}>
                    <Sparkles className="size-4" />
                    Paketi Gönder
                  </Button>

                  <div className="rounded-[22px] border border-border/70 bg-muted/35 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        Email only. Kaynak kopyası inbox&apos;una gider; bu adım seni doğrudan wizard ve tool akışına bağlamak için var.
                      </p>
                    </div>
                  </div>

                  {error ? <p className="text-sm text-primary">{error}</p> : null}
                </form>
              </>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-5">
                  <p className="text-sm font-semibold text-primary">Teslim edildi</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{leadMagnet.successTitle}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {leadMagnet.successDescription} <span className="font-medium text-foreground">{deliveredTo}</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">Hemen uygulayabileceğin hızlı adımlar</p>
                  <ul className="mt-4 space-y-3">
                    {leadMagnet.instantAccessItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-muted-foreground">
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2"
                    onClick={() =>
                      trackEvent("lead_magnet_cta_clicked", {
                        leadMagnet: leadMagnet.slug,
                        destination: "start_topic",
                      })
                    }
                  >
                    <Link href={leadMagnet.nextStepHref}>
                      {leadMagnet.nextStepLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      trackEvent("lead_magnet_cta_clicked", {
                        leadMagnet: leadMagnet.slug,
                        destination: "tools",
                      })
                    }
                  >
                    <Link href={leadMagnet.secondaryCtaHref}>{leadMagnet.secondaryCtaLabel}</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
