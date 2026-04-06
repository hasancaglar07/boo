"use client";

import * as React from "react";
import DottedMap from "dotted-map";
import { Activity, BookAudio, Map as MapIcon, MessageCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid } from "recharts";

import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const map = new DottedMap({ height: 55, grid: "diagonal" });
const points = map.getPoints();

type ChartDatum = {
  label: string;
  writing: number;
  review: number;
};

export interface Features9Props {
  badge?: string;
  title?: string;
  description?: string;
  locationTitle?: string;
  locationDescription?: string;
  supportTitle?: string;
  supportDescription?: string;
  uptimeLabel?: string;
  activityTitle?: string;
  activityDescription?: string;
  chartData?: readonly ChartDatum[];
}

const chartConfig = {
  writing: {
    label: "Yazim",
    color: "#d97706",
  },
  review: {
    label: "Duzenleme",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

const defaultChartData: readonly ChartDatum[] = [
  { label: "Hafta 1", writing: 18, review: 8 },
  { label: "Hafta 2", writing: 26, review: 12 },
  { label: "Hafta 3", writing: 38, review: 16 },
  { label: "Hafta 4", writing: 44, review: 19 },
  { label: "Hafta 5", writing: 56, review: 22 },
  { label: "Hafta 6", writing: 72, review: 30 },
] as const;

function MapGraphic() {
  return (
    <svg viewBox="0 0 120 60" className="h-full w-full text-foreground/60">
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={0.15} fill="currentColor" />
      ))}
    </svg>
  );
}

function MonitoringChart({ chartData = defaultChartData }: { chartData?: readonly ChartDatum[] }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[25rem] w-full rounded-[28px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_65%)] md:h-[23rem]" />
    );
  }

  return (
    <ChartContainer className="h-[25rem] w-full md:h-[23rem]" config={chartConfig}>
      <AreaChart accessibilityLayer data={chartData} margin={{ left: 0, right: 0 }}>
        <defs>
          <linearGradient id="fillWriting" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-writing)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--color-writing)" stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id="fillReview" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-review)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--color-review)" stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <ChartTooltip active cursor={false} content={<ChartTooltipContent className="dark:bg-muted" />} />
        <Area
          strokeWidth={2}
          dataKey="review"
          type="stepBefore"
          fill="url(#fillReview)"
          fillOpacity={0.15}
          stroke="var(--color-review)"
          stackId="book"
        />
        <Area
          strokeWidth={2}
          dataKey="writing"
          type="stepBefore"
          fill="url(#fillWriting)"
          fillOpacity={0.2}
          stroke="var(--color-writing)"
          stackId="book"
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function Features9({
  badge = "Sinyaller",
  title = "Production is not just writing, it is a tracked process.",
  description = "Research, support, and output generation feed each other within the same flow.",
  locationTitle = "Topic and market signals",
  locationDescription = "Keywords, topic clusters, and reader directions visible at a glance.",
  supportTitle = "Support and revision flow",
  supportDescription = "Issue tracking and resolution progresses more controlled with email, panel, and notes system.",
  uptimeLabel = "Output ready %99.99",
  activityTitle = "Yazım ve düzenleme ritmi",
  activityDescription = "Outline, chapter writing, and quality editing can be tracked within the same timeline.",
  chartData = defaultChartData,
}: Features9Props) {
  return (
    <section className="py-16 md:py-24">
      <div className="shell">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>{badge}</Badge>
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[30px] border border-border/80 bg-card/90 md:grid-cols-2">
          <div>
            <div className="p-6 sm:p-10">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapIcon className="size-4" />
                Pazar haritasi
              </span>
              <p className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{locationTitle}</p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">{locationDescription}</p>
            </div>

            <div aria-hidden className="relative px-4 pb-6 sm:px-8">
              <div className="absolute inset-0 z-10 m-auto size-fit">
                <div className="relative z-10 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium shadow-sm">
                  <span className="text-base">🌍</span> US / UK / Canada demand cluster
                </div>
                <div className="absolute inset-x-2 -bottom-2 h-9 rounded-full border border-border bg-background/80 blur-[1px]" />
              </div>

              <div className="relative overflow-hidden rounded-[24px] border border-border bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_60%)]" />
                <MapGraphic />
              </div>
            </div>
          </div>

          <div className="border-t border-border/80 bg-secondary/35 p-6 sm:border-l sm:border-t-0 sm:p-10">
            <div className="relative z-10">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="size-4" />
                Yardim ve geri bildirim
              </span>
              <p className="my-6 text-2xl font-semibold tracking-tight text-foreground">{supportTitle}</p>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">{supportDescription}</p>
            </div>

            <div aria-hidden className="mt-8 flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full border border-border bg-background">
                    <span className="size-2.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs text-muted-foreground">Bugun</span>
                </div>
                <div className="mt-2 w-4/5 rounded-[20px] border border-border bg-background p-4 text-sm text-foreground">
                  Outline is good but chapter 2 needs more examples.
                </div>
              </div>

              <div>
                <div className="ml-auto w-4/5 rounded-[20px] bg-primary px-4 py-3 text-sm text-primary-foreground">
                  Note taken. Expanding the chapter and preparing a new EPUB test.
                </div>
                <span className="mt-2 block text-right text-xs text-muted-foreground">Simdi</span>
              </div>
            </div>
          </div>

          <div className="col-span-full border-y border-border/80 px-6 py-10 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BookAudio className="size-4" />
              Yayin ritmi
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">{uptimeLabel}</p>
          </div>

          <div className="relative col-span-full overflow-hidden">
            <div className="absolute z-10 max-w-lg px-6 pt-6 md:px-10 md:pt-10">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="size-4" />
                Aktivite akisi
              </span>
              <p className="my-6 text-2xl font-semibold tracking-tight text-foreground">{activityTitle}</p>
              <p className="text-sm leading-7 text-muted-foreground">{activityDescription}</p>
            </div>
            <MonitoringChart chartData={chartData} />
          </div>
        </div>
      </div>
    </section>
  );
}