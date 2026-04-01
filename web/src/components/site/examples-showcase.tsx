"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Globe,
  Layers,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import type { ExampleAsset, ExampleEntry } from "@/lib/examples-shared";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

const pipeline = [
  {
    step: "01",
    title: "Brief",
    description: "Konu, hedef okur ve dil seçimi. 5 soruluk wizard.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Outline",
    description: "Bölüm mimarisi ve kitap vaadi. Onaydan sonra devam.",
    icon: Layers,
  },
  {
    step: "03",
    title: "Bölümler",
    description: "İlk bölüm üretimi, kalite revizyonları ve devam iterasyonları.",
    icon: FileText,
  },
  {
    step: "04",
    title: "Kapak",
    description: "Ön ve arka kapak seçenekleri. KDP boyutlarında hazır.",
    icon: BookOpen,
  },
  {
    step: "05",
    title: "Export",
    description: "EPUB, PDF ve HTML teslimi. Anında indirilebilir.",
    icon: Download,
  },
];

function formatBytes(size?: number) {
  if (!size) return "Hazır";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function availableFormats(item: ExampleEntry) {
  return (["epub", "pdf", "html"] as const)
    .filter((key) => item.exports[key])
    .map((key) => key.toUpperCase());
}

function exportSummary(item: ExampleEntry) {
  const formats = availableFormats(item);
  return formats.length ? formats.join(" + ") : "Yakında";
}

function publicationMeta(item: ExampleEntry) {
  return [item.publisher, item.year].filter(Boolean).join(" · ");
}

function creatorMeta(item: ExampleEntry) {
  return [item.author, item.publisher].filter(Boolean).join(" · ");
}

function BookCover({
  item,
  size = "md",
}: {
  item: ExampleEntry;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: { w: "w-16", h: "h-[88px]", spine: "w-3" },
    md: { w: "w-24", h: "h-[136px]", spine: "w-4" },
    lg: { w: "w-32", h: "h-[184px]", spine: "w-5" },
  }[size];

  return (
    <div className="flex">
      <div
        className={cn(dims.spine, dims.h, "rounded-l-sm flex-shrink-0 shadow-inner")}
        style={{
          background: "linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.1))",
          backgroundColor: item.spineColor,
        }}
      />
      <div
        className={cn(dims.w, dims.h, "relative overflow-hidden rounded-r-sm shadow-2xl")}
        style={{
          background: item.coverGradient,
          transform: "perspective(600px) rotateY(-6deg)",
          transformOrigin: "left center",
        }}
      >
        {item.coverImageUrl ? (
          <>
            <img
              src={item.coverImageUrl}
              alt={`${item.title} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" />
            <div
              className="absolute bottom-2 left-2 right-2 rounded-md border px-1.5 py-1 text-[6px] font-semibold uppercase tracking-[0.22em]"
              style={{
                color: item.textAccent,
                borderColor: "rgba(255,255,255,0.25)",
                backgroundColor: "rgba(0,0,0,0.28)",
              }}
            >
              Real Output
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            <div
              className="absolute inset-x-3 top-3 h-px opacity-30"
              style={{ backgroundColor: item.textAccent }}
            />
            <div
              className="absolute inset-x-3 bottom-8 h-px opacity-20"
              style={{ backgroundColor: item.textAccent }}
            />
            <div className="absolute inset-0 flex flex-col justify-between p-3">
              <div
                className="text-[7px] font-bold leading-tight tracking-wide opacity-90 line-clamp-3"
                style={{ color: item.textAccent, fontFamily: "var(--font-serif)" }}
              >
                {item.title}
              </div>
              {item.brandingMark && (
                <div
                  className="self-start rounded-full border px-1.5 py-0.5 text-[5px] font-semibold uppercase tracking-[0.22em]"
                  style={{
                    color: item.textAccent,
                    borderColor: "rgba(255,255,255,0.22)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                  }}
                >
                  {item.brandingMark}
                </div>
              )}
              <div
                className="text-[6px] uppercase tracking-widest opacity-60"
                style={{ color: item.textAccent }}
              >
                REAL OUTPUT
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        )}
      </div>
    </div>
  );
}

function ExportCard({
  item,
  format,
  description,
  asset,
  icon: Icon,
}: {
  item: ExampleEntry;
  format: "EPUB" | "PDF" | "HTML";
  description: string;
  asset?: ExampleAsset;
  icon: typeof BookOpen;
}) {
  const isHtml = format === "HTML";

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-4 transition",
        asset
          ? "border-border/80 bg-background hover:bg-accent/30"
          : "border-dashed border-border/50 bg-muted/20 opacity-50",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: asset ? item.spineColor : undefined, opacity: asset ? 1 : 0.4 }}
        >
          <Icon className="size-4 text-white" />
        </div>
        {asset && <CheckCircle2 className="size-4 text-emerald-500" />}
      </div>
      <div className="mt-3">
        <div className="text-sm font-bold text-foreground">.{format.toLowerCase()}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {asset ? formatBytes(asset.size) : "Henüz yok"}
        </span>
        {asset && (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            style={{ backgroundColor: item.spineColor }}
          >
            <Download className="size-3" />
            {isHtml ? "Aç" : "İndir"}
          </a>
        )}
      </div>
    </div>
  );
}

function OutlineModal({
  item,
  onClose,
}: {
  item: ExampleEntry;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"outline" | "chapter" | "export">("outline");
  const publicationLine = publicationMeta(item);
  const creatorLine = creatorMeta(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-2xl">
        <div
          className="relative flex items-center gap-5 border-b border-border/60 p-6"
          style={{ background: item.coverGradient }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          <div className="relative flex-shrink-0">
            <BookCover item={item} size="sm" />
          </div>
          <div className="relative min-w-0 flex-1">
            <div
              className="mb-1 text-[10px] font-semibold uppercase tracking-widest opacity-70"
              style={{ color: item.textAccent }}
            >
              {item.category} · {item.language}
            </div>
            <h3
              className="text-lg font-semibold leading-tight"
              style={{ color: item.textAccent, fontFamily: "var(--font-serif)" }}
            >
              {item.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed opacity-80" style={{ color: item.textAccent }}>
              {item.subtitle}
            </p>
            {creatorLine && (
              <p className="mt-2 text-[11px] opacity-75" style={{ color: item.textAccent }}>
                {creatorLine}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.brandingLogoUrl ? (
                <img
                  src={item.brandingLogoUrl}
                  alt={`${item.brandingMark || item.publisher || item.title} logosu`}
                  className="size-9 rounded-xl border border-white/20 bg-white/10 p-1.5"
                />
              ) : item.brandingMark ? (
                <div
                  className="inline-flex size-9 items-center justify-center rounded-xl border text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: item.textAccent,
                    borderColor: "rgba(255,255,255,0.24)",
                    backgroundColor: "rgba(0,0,0,0.16)",
                  }}
                >
                  {item.brandingMark}
                </div>
              ) : null}
              {item.toneArchetype && (
                <div
                  className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    color: item.textAccent,
                    borderColor: "rgba(255,255,255,0.22)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                  }}
                >
                  {item.toneArchetype}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative flex-shrink-0 rounded-full p-2 transition hover:bg-black/20"
            style={{ color: item.textAccent }}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex border-b border-border/60 bg-background/50">
          {(["outline", "chapter", "export"] as const).map((tab) => {
            const labels = { outline: "İçindekiler", chapter: "Bölüm Önizleme", export: "Export" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 border-b-2 py-3 text-xs font-semibold tracking-wide transition-colors",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "outline" && (
            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5">
                  <Layers className="size-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.chapters} bölüm</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5">
                  <Globe className="size-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.language}</span>
                </div>
                {publicationLine && (
                  <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5">
                    <BookOpen className="size-3 text-primary" />
                    <span className="text-xs font-medium text-foreground">{publicationLine}</span>
                  </div>
                )}
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Yazar
                  </div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{item.author}</div>
                  {item.authorBio && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.authorBio}</p>}
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Branding
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {item.brandingLogoUrl ? (
                      <img
                        src={item.brandingLogoUrl}
                        alt={`${item.brandingMark || item.publisher || item.title} logosu`}
                        className="size-12 rounded-2xl border border-border/80 bg-background p-2"
                      />
                    ) : null}
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {item.brandingMark || item.publisher || "Brand"}
                      </div>
                      {item.coverBrief && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.coverBrief}</p>}
                    </div>
                  </div>
                </div>
              </div>
              {item.outline.length ? (
                <div className="space-y-1" dir={item.direction}>
                  {item.outline.map((chapter) => (
                    <div
                      key={`${item.id}-${chapter.num}`}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 transition hover:bg-accent/40"
                    >
                      <span
                        className="flex size-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                        style={{ backgroundColor: item.spineColor }}
                      >
                        {chapter.num}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{chapter.title}</span>
                      {chapter.pages && <span className="text-xs text-muted-foreground">{chapter.pages}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-5 text-sm text-muted-foreground">
                  Outline dosyası bulundu ama yapı okunabilir bir liste olarak parse edilemedi.
                </div>
              )}
            </div>
          )}

          {activeTab === "chapter" && (
            <div className="p-6">
              <div className="mb-4">
                <div
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground"
                  style={{ backgroundColor: item.spineColor }}
                >
                  {item.chapterPreview.chapter}
                </div>
                <h4 className="mt-3 font-serif text-xl font-semibold text-foreground">
                  {item.chapterPreview.title}
                </h4>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  İlk bölümden alınan gerçek önizleme metni.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/60 p-5" dir={item.direction}>
                <div className="prose prose-sm max-w-none">
                  {item.chapterPreview.text.split("\n\n").map((paragraph, index) => (
                    <p
                      key={`${item.id}-paragraph-${index}`}
                      className={cn(
                        "mb-4 text-sm leading-7 text-foreground last:mb-0",
                        item.direction === "rtl" && "text-right",
                      )}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: "14%", backgroundColor: item.spineColor }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Gerçek ilk bölüm önizlemesi</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-serif text-lg font-semibold text-foreground">Teslim Formatları</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sadece gerçekten üretilmiş export dosyaları aktif kalır.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ExportCard
                  item={item}
                  format="EPUB"
                  description="E-okuyucu için gerçek export"
                  asset={item.exports.epub}
                  icon={BookOpen}
                />
                <ExportCard
                  item={item}
                  format="PDF"
                  description="Baskı veya paylaşım için export"
                  asset={item.exports.pdf}
                  icon={FileText}
                />
                <ExportCard
                  item={item}
                  format="HTML"
                  description="Web önizleme için export"
                  asset={item.exports.html}
                  icon={Globe}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-border/80 bg-background/60 p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 flex-shrink-0 text-emerald-500" />
                  {availableFormats(item).length
                    ? `${availableFormats(item).join(", ")} dosyaları public read-only route üzerinden açılır.`
                    : "Bu örnek için export dosyası henüz public vitrinde gösterilecek seviyeye gelmemiş."}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-background/80 p-4">
          <Link
            href="/start/topic"
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            style={{ backgroundColor: item.spineColor }}
            onClick={onClose}
          >
            Bunu sen yaz <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ExamplesShowcase({
  items,
  categories,
  languages,
}: {
  items: ExampleEntry[];
  categories: string[];
  languages: string[];
}) {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [activeLang, setActiveLang] = useState("Tümü");
  const [previewItem, setPreviewItem] = useState<ExampleEntry | null>(null);
  const [topic, setTopic] = useState("");

  const filtered = items.filter((item) => {
    const categoryMatch = activeCategory === "Tümü" || item.category === activeCategory;
    const languageMatch = activeLang === "Tümü" || item.language === activeLang;
    return categoryMatch && languageMatch;
  });

  return (
    <>
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kategori
              </span>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="hidden h-px w-px sm:block" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dil
              </span>
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => setActiveLang(language)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    activeLang === language
                      ? "bg-foreground text-background shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div
                  className="relative flex h-44 items-end justify-between px-5 pb-5 pt-5"
                  style={{ background: item.coverGradient }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
                  <div className="relative z-10 flex flex-col gap-2">
                    <span
                      className="self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.18)",
                        color: item.textAccent,
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                    >
                      {item.category}
                    </span>
                    <span
                      className="self-start rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.22)",
                        color: item.textAccent,
                      }}
                    >
                      {item.language}
                    </span>
                  </div>
                  <div className="relative z-10 flex-shrink-0">
                    <BookCover item={item} size="md" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-base font-semibold leading-tight text-foreground">
                    {item.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-3">
                    {item.brandingLogoUrl ? (
                      <img
                        src={item.brandingLogoUrl}
                        alt={`${item.brandingMark || item.publisher || item.title} logosu`}
                        className="size-10 rounded-xl border border-border/80 bg-background p-1.5"
                      />
                    ) : item.brandingMark ? (
                      <div
                        className="inline-flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background text-[10px] font-bold uppercase tracking-[0.18em] text-foreground"
                      >
                        {item.brandingMark}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">{item.author}</div>
                      <div className="text-[11px] text-muted-foreground">{item.publisher}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-foreground/80 line-clamp-2">{item.subtitle}</p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground line-clamp-3">{item.summary}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Bölüm", value: String(item.chapters) },
                      { label: "Dil", value: item.language },
                      { label: "Export", value: exportSummary(item) },
                    ].map(({ label, value }) => (
                      <div
                        key={`${item.id}-${label}`}
                        className="rounded-xl border border-border/80 bg-background px-2 py-2"
                      >
                        <div className="line-clamp-2 text-xs font-bold text-foreground">{value}</div>
                        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {publicationMeta(item) && (
                    <p className="mt-3 text-[11px] text-muted-foreground">{publicationMeta(item)}</p>
                  )}

                  {item.coverBrief && (
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground line-clamp-2">{item.coverBrief}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={`${item.id}-${tag}`}
                        className="rounded-full border border-border/80 bg-accent/60 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent"
                    >
                      <Eye className="size-3.5" />
                      Önizle
                    </button>
                    <Link
                      href="/start/topic"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                      style={{ backgroundColor: item.spineColor }}
                    >
                      Yaz <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-5xl">📚</div>
              <p className="text-base font-medium text-foreground">Bu filtre için örnek yok</p>
              <p className="mt-2 text-sm text-muted-foreground">Farklı bir kategori veya dil seç.</p>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border/80 bg-accent/20 py-16">
        <div className="shell mx-auto max-w-2xl text-center">
          <SectionHeading
            badge="Kendi konunu dene"
            title="Hangi kitabı yazmak istiyorsun?"
            description="Konunu yaz, aynı akışla kendi taslağını oluştur. Kredi kartı gerekmez."
            align="center"
          />
          <div className="mt-6 flex gap-2">
            <input
              type="text"
              placeholder="örn: Freelance fiyatlandırma rehberi..."
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && topic.trim()) {
                  window.location.href = `/start/topic?topic=${encodeURIComponent(topic)}`;
                }
              }}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Link
              href={`/start/topic${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
            >
              Başlat <ArrowRight className="size-4" />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Ücretsiz önizleme · Kayıt gerekmez</p>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Üretim zinciri"
            title="Outline'dan export'a kadar görülebilir akış"
            description="Her adım ayrı bir ekran. Nerede olduğunu, ne geldiğini her zaman bilirsin."
          />

          <div className="relative">
            <div className="absolute inset-x-0 top-10 hidden h-px bg-border/60 md:block" />

            <div className="grid gap-4 md:grid-cols-5">
              {pipeline.map((step, index) => (
                <div key={step.step} className="relative flex flex-col items-start md:items-center">
                  <div className="relative z-10 mb-4 flex size-10 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm">
                    <step.icon className="size-4 text-primary" />
                  </div>

                  <div className="w-full rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      {step.step}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
                    {index === pipeline.length - 1 && (
                      <Link
                        href="/start/topic"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Başla <ChevronRight className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {previewItem && <OutlineModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </>
  );
}
