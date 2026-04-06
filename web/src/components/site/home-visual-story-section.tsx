"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  BookOpenText,
  CheckCircle2,
  FileOutput,
  ImagePlus,
  Languages,
  LayoutTemplate,
  SearchCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const storySteps = [
  {
    step: "1",
    badge: "Topic Brief",
    title: "Enter your idea. Let the system build the book direction.",
    description:
      "Write your book type, topic, target reader, and language preference. The system proposes a title, subtitle, and initial outline on a single screen.",
    bullets: ["Localized interface", "English output", "Title + description"],
    mock: "brief",
  },
  {
    step: "2",
    badge: "Chapter Plan",
    title: "Review the outline. Clarify the chapter order.",
    description:
      "Before writing begins, review the chapter flow, reader promise, and research signals — all in one place.",
    bullets: ["Chapter structure", "Keyword direction", "Editable outline"],
    mock: "outline",
  },
  {
    step: "3",
    badge: "Publish",
    title: "Generate content. Add a cover. Get the EPUB.",
    description:
      "Chapters are created in sequence, the cover flow is added, and the first delivery files land in your publish folder.",
    bullets: ["Cover flow", "EPUB + PDF", "Output folder"],
    mock: "publish",
  },
] as const;

function MockFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-border/80 bg-card/85 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/85" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/45" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/25" />
        </div>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

function BriefMock() {
  return (
    <MockFrame title="New book">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          {[
            ["Book type", "Practical guide"],
            ["Topic", "Selling consulting via email"],
            ["Target reader", "Freelance designers"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-border/80 bg-background/90 px-4 py-3"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            {["English", "6 chapters", "Not a short promo book"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-accent/60 px-3 py-1 text-xs text-accent-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_72%)] p-5"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
            <Sparkles className="size-4" />
            AI suggestion
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Inbox to Income
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            A clean, sales-driven guide on how to position your expertise via email.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              "Title + subtitle",
              "Book description",
              "First chapter plan",
              "Chapter order",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-xs text-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </MockFrame>
  );
}

function OutlineMock() {
  return (
      <MockFrame title="Chapter plan + research">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-2">
          {[
            "01. Problem and promise",
            "02. Positioning",
            "03. Offer structure",
            "04. Example flow",
            "05. Objections",
            "06. Next step",
          ].map((chapter, index) => (
            <div
              key={chapter}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                index === 1
                  ? "border-primary/35 bg-accent/80 text-foreground"
                  : "border-border/80 bg-background/90 text-muted-foreground",
              )}
            >
              {chapter}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-border/80 bg-background/95 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpenText className="size-4 text-primary" />
              Chapter 2: Positioning
            </div>
            <div className="mt-4 space-y-2">
              {[
                "Who it's written for becomes clear on the first page.",
                "The quick-result promise is established in a single sentence.",
                "A chapter skeleton that builds trust before the offer is prepared.",
              ].map((line) => (
                <div
                  key={line}
                  className="rounded-2xl border border-border/70 bg-card/80 px-3 py-3 text-xs leading-6 text-foreground"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <SearchCheck className="size-4 text-primary" />
                Keyword direction
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["email sales", "consulting offer", "client system"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Languages className="size-4 text-primary" />
                Output language
              </div>
              <div className="mt-3 text-xs leading-6 text-muted-foreground">
                The dashboard stays localized. Book content progresses in English.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function PublishMock() {
  return (
    <MockFrame title="Prepare for Publishing">
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex items-end justify-center gap-3 rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_80%)] px-4 py-6">
          {[
            ["Production Summary", "amber", "KDP"],
            ["Book for Email", "zinc", "EPUB"],
            ["Publish Notes", "orange", "PDF"],
          ].map(([title, tone, badge], index) => (
            <motion.div
              key={title}
              animate={{ y: [0, index === 1 ? -4 : 4, 0] }}
              transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "flex h-44 w-28 flex-col justify-between rounded-t-[30px] px-4 py-4 text-white shadow-xl",
                tone === "amber" && "bg-[linear-gradient(180deg,#f5b24c,#d97706)]",
                tone === "zinc" && "h-52 bg-[linear-gradient(180deg,#52525b,#18181b)]",
                tone === "orange" && "bg-[linear-gradient(180deg,#fb923c,#ea580c)]",
              )}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/70">{badge}</div>
              <div className="text-sm font-semibold leading-5">{title}</div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/80 bg-background/95 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileOutput className="size-4 text-primary" />
              Output status
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["EPUB", "Ready"],
                ["PDF", "In queue"],
                ["Cover files", "Ready"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
                  <span className="text-sm text-foreground">{label}</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ImagePlus className="size-4 text-primary" />
                Cover flow
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Front cover, back cover, and output folder are all organized under a single book.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LayoutTemplate className="size-4 text-primary" />
                Delivery files
              </div>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                A timestamped folder makes it clear which output was generated and when.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

function renderMock(mock: (typeof storySteps)[number]["mock"]) {
  if (mock === "brief") return <BriefMock />;
  if (mock === "outline") return <OutlineMock />;
  return <PublishMock />;
}

export function HomeVisualStorySection() {
  return (
    <section className="border-b border-border/80 py-20 md:py-24">
      <div className="shell">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>3 steps</Badge>
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Write your idea. Review the outline. Publish your book.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            The goal here isn't to show many screens. It's to show the right order. The user understands what to do and when at a single glance.
          </p>
        </div>

        <div className="mt-12 space-y-8 md:space-y-10">
          {storySteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "grid items-center gap-6 rounded-[36px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--primary)_2%,var(--card)))] p-5 shadow-sm md:p-7 lg:grid-cols-[0.8fr_1.2fr]",
                index % 2 === 1 && "lg:grid-cols-[1.2fr_0.8fr]",
              )}
            >
              <div className={cn("space-y-5", index % 2 === 1 && "lg:order-2")}>
                <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-accent text-primary">
                    {item.step}
                  </span>
                  {item.badge}
                </div>

                <div>
                  <h3 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.bullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              </div>

              <div className={cn(index % 2 === 1 && "lg:order-1")}>{renderMock(item.mock)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}