"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  BookOpenText,
  CheckCircle2,
  FileOutput,
  MessageSquareText,
  SearchCheck,
  Sparkles,
} from "lucide-react";

const overviewItems = [
  {
    title: "No more staring at a blank page",
    description:
      "Combine your topic, target reader, and promise into a single brief. The system suggests a title, chapter outline, and publishing direction in seconds.",
    icon: SearchCheck,
  },
  {
    title: "No scattered toolchain",
    description:
      "Topic brief → chapter plan → chapter writing → cover → output. Every step is connected; nothing gets lost in a separate tool.",
    icon: MessageSquareText,
  },
  {
    title: "Your ready-to-publish file is in hand",
    description:
      "The goal isn't endless drafts: it's getting your first EPUB and delivery folder with confidence. The system prioritizes this from the start.",
    icon: FileOutput,
  },
] as const;

function SignalCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: (typeof overviewItems)[number]["icon"];
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/4 p-5 text-left backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-[#f0a27f]">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-stone-300">{description}</p>
    </div>
  );
}

function BoardPill({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-[#f0a27f]/50 bg-[#f0a27f]/12 text-[#ffd8c7]"
          : "border-white/10 bg-white/5 text-stone-300"
      }`}
    >
      {children}
    </span>
  );
}

export function HomeProductOverviewSection() {
  return (
    <section className="border-b border-border/80 bg-[#1e1b18] text-white">
      <div className="shell py-20 md:py-24">
        <div className="mt-0 grid gap-4 md:grid-cols-3">
          {overviewItems.map((item) => (
            <SignalCard key={item.title} {...item} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.65)] md:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-[260px_1fr_220px]">
            <div className="space-y-3 rounded-[28px] border border-white/8 bg-black/18 p-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
                Input
              </div>
              {[
                ["Book type", "Practical guide"],
                ["Topic", "Getting clients via email"],
                ["Reader", "Solo consultants"],
                ["Language", "English"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-stone-500">{label}</div>
                  <div className="mt-1 text-sm font-medium text-white">{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[30px] border border-white/8 bg-[#12100f] p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f0a27f]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <BoardPill active>Topic</BoardPill>
                  <BoardPill>Draft</BoardPill>
                  <BoardPill>Publish</BoardPill>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[26px] border border-white/8 bg-white/4 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Sparkles className="size-4 text-[#f0a27f]" />
                    AI book direction
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                    Inbox to Income
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-stone-300">
                    A straightforward guide on how freelance consultants build trust via email and sell their first low-priced info product.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      "Title + subtitle",
                      "Description",
                      "Chapter outline",
                      "Initial sales angle",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/90"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "01. Problem and promise",
                    "02. Positioning",
                    "03. Offer structure",
                    "04. Email flow",
                    "05. Final call",
                  ].map((line, index) => (
                    <div
                      key={line}
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        index === 1
                          ? "border-[#f0a27f]/35 bg-[#f0a27f]/10 text-[#ffe6da]"
                          : "border-white/8 bg-white/4 text-stone-300"
                      }`}
                    >
                      {line}
                    </div>
                  ))}

                  <div className="rounded-[24px] border border-white/8 bg-[#161310] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Bot className="size-4 text-[#f0a27f]" />
                      System note
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-300">
                      The book description, chapter structure, and writing order are built together from the same topic brief.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[28px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="size-4 text-[#f0a27f]" />
                  What you get
                </div>
                <div className="mt-4 space-y-2">
                  {["Draft", "Chapter content", "Cover flow", "EPUB output"].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-black/16 px-3 py-2 text-xs text-stone-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(240,162,127,0.12),rgba(240,162,127,0.02))] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <BookOpenText className="size-4 text-[#f0a27f]" />
                  Core logic
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  Direction first, then writing, then delivery. The homepage should show this directly.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <a
            href="/start/topic"
            className="inline-flex items-center gap-2 rounded-full border border-[#f0a27f]/40 bg-[#f0a27f]/10 px-6 py-3 text-sm font-medium text-[#ffd8c7] transition-colors hover:bg-[#f0a27f]/18"
          >
            <span>Start your first book</span>
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}