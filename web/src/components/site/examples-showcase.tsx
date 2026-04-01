"use client";

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

import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

const showcases = [
  {
    id: "playful-path",
    category: "Eğitim Kitabı",
    language: "English",
    type: "Rehber",
    title: "The Playful Path",
    subtitle: "Unlocking Your Child's Potential Through Joyful, Play-Based Learning for Ages 3–8",
    summary:
      "Oyun tabanlı öğrenmenin nörobilimine dayanan, 3–8 yaş arası çocukların gelişimini destekleyen uygulama odaklı bir rehber.",
    tags: ["Outline hazır", "EPUB alındı", "English"],
    spineColor: "#c26d44",
    coverGradient: "linear-gradient(155deg,#e8956d 0%,#b85730 50%,#7c3519 100%)",
    accentColor: "#e8956d",
    textAccent: "#fff3ed",
    pages: "224",
    time: "3 gün",
    format: "EPUB + PDF",
    chapters: 9,
    outline: [
      { num: 1, title: "Why Play Is Serious Business", pages: "pp. 1–24" },
      { num: 2, title: "The Neuroscience of Playful Learning", pages: "pp. 25–48" },
      { num: 3, title: "Building Your Play-Friendly Home", pages: "pp. 49–72" },
      { num: 4, title: "Unstructured Play — The Foundation", pages: "pp. 73–96" },
      { num: 5, title: "Story, Song & Creative Expression", pages: "pp. 97–124" },
      { num: 6, title: "Collaborative & Social Play", pages: "pp. 125–148" },
      { num: 7, title: "Nature Play & Outdoor Discovery", pages: "pp. 149–172" },
      { num: 8, title: "Screen Time & Digital Balance", pages: "pp. 173–196" },
      { num: 9, title: "From Play to School Readiness", pages: "pp. 197–224" },
    ],
    chapterPreview: {
      chapter: "Bölüm 2",
      title: "The Neuroscience of Playful Learning",
      text: `When a child stacks blocks, knocks them down, and stacks them again, she isn't simply playing — she's building the prefrontal cortex pathways that will later support planning, impulse control, and executive function.

Neuroscientist Adele Diamond's landmark research at UBC demonstrated that children who engage in self-directed play score significantly higher on measures of working memory and cognitive flexibility than those in structured, adult-led programs of equal duration.

The mechanism is elegant: play activates the brain's dopaminergic reward system. Each small discovery — a tower that holds, a puzzle piece that fits — triggers a micro-burst of dopamine, reinforcing curiosity and driving the child to explore further. This creates a self-sustaining learning loop that no worksheet can replicate.`,
    },
    kdp: true,
  },
  {
    id: "micro-influence",
    category: "Business Playbook",
    language: "English",
    type: "Playbook",
    title: "The Micro-Influence Advantage",
    subtitle: "Building Your Niche Brand and Monetizing Your Passion Online",
    summary:
      "1.000 ile 50.000 takipçisi olan içerik üreticileri için niş otorite kurma ve gelir çeşitlendirme sistemi.",
    tags: ["Keyword araştırma", "KDP uyumlu", "English"],
    spineColor: "#2a4b7c",
    coverGradient: "linear-gradient(155deg,#3b6cb5 0%,#1e3f7a 50%,#0d2047 100%)",
    accentColor: "#5c8fd6",
    textAccent: "#e8f0ff",
    pages: "212",
    time: "4 gün",
    format: "EPUB + PDF + HTML",
    chapters: 10,
    outline: [
      { num: 1, title: "The Micro-Influence Mindset Shift", pages: "pp. 1–20" },
      { num: 2, title: "Niche Selection: Passion Meets Profit", pages: "pp. 21–44" },
      { num: 3, title: "Content Pillars & Brand Positioning", pages: "pp. 45–70" },
      { num: 4, title: "Platform Strategy for Micro-Creators", pages: "pp. 71–96" },
      { num: 5, title: "Building Your First 1K True Fans", pages: "pp. 97–118" },
      { num: 6, title: "Monetization Without Selling Out", pages: "pp. 119–144" },
      { num: 7, title: "The Digital Product Stack", pages: "pp. 145–166" },
      { num: 8, title: "Email List as Your True Asset", pages: "pp. 167–186" },
      { num: 9, title: "Collaboration & Community Growth", pages: "pp. 187–202" },
      { num: 10, title: "Scaling: From Micro to Mid-Tier", pages: "pp. 203–212" },
    ],
    chapterPreview: {
      chapter: "Bölüm 6",
      title: "Monetization Without Selling Out",
      text: `The fear most micro-creators carry is this: the moment I try to make money, my audience will leave. This fear is both understandable and empirically false.

Research by the Creator Economy Research Institute found that audiences are 3.4× more likely to purchase from creators they perceive as "authentic experts" than from those with ten times the follower count. Authenticity is not the enemy of monetization — it is its engine.

The key is sequencing. Before your first product launch, you need three things in place: a body of content your audience has already found valuable (trust capital), a clear transformation you offer (clarity of promise), and a community space — however small — where conversation happens (social proof infrastructure).

When these three elements align, monetization feels less like a pitch and more like a natural next step.`,
    },
    kdp: true,
  },
  {
    id: "niche-offer-os",
    category: "Business Playbook",
    language: "English",
    type: "Playbook",
    title: "Niche Offer Operating System",
    subtitle: "A Step-by-Step Framework for Packaging Expertise Into Irresistible Offers",
    summary:
      "Araştırma notlarıyla destekli bölüm akışı ve yayın odaklı metadata ile tamamlanmış operasyonel rehber.",
    tags: ["Araştırma notları", "Kapak revizyonu", "PDF hazır"],
    spineColor: "#3d2c8a",
    coverGradient: "linear-gradient(155deg,#6b52d3 0%,#3d2c8a 50%,#1e1450 100%)",
    accentColor: "#9b84f0",
    textAccent: "#f0edff",
    pages: "196",
    time: "3 gün",
    format: "EPUB + PDF + HTML",
    chapters: 8,
    outline: [
      { num: 1, title: "From Expertise to Offer Architecture", pages: "pp. 1–22" },
      { num: 2, title: "The Offer Clarity Framework", pages: "pp. 23–48" },
      { num: 3, title: "Positioning in a Crowded Market", pages: "pp. 49–72" },
      { num: 4, title: "Pricing Psychology & Value Anchoring", pages: "pp. 73–98" },
      { num: 5, title: "Sales Copy That Converts", pages: "pp. 99–124" },
      { num: 6, title: "Delivery Systems & Client Experience", pages: "pp. 125–150" },
      { num: 7, title: "Referral Engines & Retention", pages: "pp. 151–172" },
      { num: 8, title: "Scaling Without Burnout", pages: "pp. 173–196" },
    ],
    chapterPreview: {
      chapter: "Bölüm 4",
      title: "Pricing Psychology & Value Anchoring",
      text: `Most consultants price from cost: how many hours will this take, what's my hourly rate, multiply. This is the single most profitable mistake you can make — profitable for your competitors.

Buyers don't evaluate price against your cost. They evaluate it against the value of the transformation, the cost of inaction, and the price of the next best alternative. This is why a $5,000 offer positioned against a $50,000 problem feels cheap, while the same offer positioned against "a few coaching calls" feels expensive.

Value anchoring is the practice of establishing the reference point before revealing your price. Done well, it reframes the buyer's mental denominator — so your number lands in a context that makes it feel like the obvious choice.`,
    },
    kdp: false,
  },
  {
    id: "dijital-urun",
    category: "Uzmanlık Rehberi",
    language: "Türkçe",
    type: "Rehber",
    title: "Dijital Ürün Lansman Rehberi",
    subtitle: "İlk Dijital Ürününü Sıfırdan Yayınlamak İçin Adım Adım Sistem",
    summary:
      "Türkçe içerik, hedef okur: ilk dijital ürününü çıkaracak girişimciler. KDP uyumlu metadata ve kapak dahil.",
    tags: ["Türkçe içerik", "KDP uyumlu", "PDF hazır"],
    spineColor: "#0e6b6b",
    coverGradient: "linear-gradient(155deg,#1ab3b3 0%,#0a7878 50%,#064040 100%)",
    accentColor: "#1ab3b3",
    textAccent: "#e6fafa",
    pages: "156",
    time: "4 gün",
    format: "EPUB + PDF",
    chapters: 7,
    outline: [
      { num: 1, title: "Dijital Ürün Nedir, Neden Şimdi?", pages: "ss. 1–20" },
      { num: 2, title: "Ürün Fikri Validation Sistemi", pages: "ss. 21–44" },
      { num: 3, title: "İçerik Üretim Hızlandırıcı", pages: "ss. 45–72" },
      { num: 4, title: "Fiyatlandırma ve Paketleme", pages: "ss. 73–96" },
      { num: 5, title: "Lansman Öncesi İzleyici İnşası", pages: "ss. 97–120" },
      { num: 6, title: "Lansman Günü Playbook", pages: "ss. 121–138" },
      { num: 7, title: "Lansman Sonrası: Pasif Gelire Geçiş", pages: "ss. 139–156" },
    ],
    chapterPreview: {
      chapter: "Bölüm 3",
      title: "İçerik Üretim Hızlandırıcı",
      text: `Çoğu dijital ürün yaratıcısı içerik üretiminde takılı kalır. Sebebi mükemmeliyetçilik değil — çoğunlukla yapının yokluğudur. Ne yazacağını bilmiyorsun, o yüzden her sabah boş ekrana bakıyorsun.

Hızlandırıcı sistem üç katmandan oluşur: önce iskelet (bölüm başlıkları ve alt başlıklar), sonra ham içerik (hiç düzenleme yapmadan akan yazı), en son rötuş (okuyucu deneyimi odaklı revizyon). Bu sıralamayı bozmak neredeyse her zaman felç eder.

İçeriğini zaten biliyorsun — onu on yıldır danışanlarınıza söylüyorsun. Tek ihtiyacın doğru yapı ve bir başlangıç noktası.`,
    },
    kdp: true,
  },
  {
    id: "coaching-offer",
    category: "Uzmanlık Rehberi",
    language: "English",
    type: "Rehber",
    title: "Coaching Program from Zero to Offer",
    subtitle: "Design, Price and Launch Your First Coaching Package Even Without a Big Audience",
    summary:
      "Türkçe panelde oluşturulup English kitaba dönüştürülen rehber. İki dilli üretim akışının referans örneği.",
    tags: ["Türkçe panel", "English kitap", "EPUB önce"],
    spineColor: "#16602e",
    coverGradient: "linear-gradient(155deg,#2da854 0%,#167334 50%,#072e14 100%)",
    accentColor: "#4dca76",
    textAccent: "#e8fdf0",
    pages: "168",
    time: "1 hafta",
    format: "EPUB",
    chapters: 7,
    outline: [
      { num: 1, title: "The Offer-First Mindset", pages: "pp. 1–22" },
      { num: 2, title: "Identifying Your Ideal Client Avatar", pages: "pp. 23–46" },
      { num: 3, title: "Designing Your Coaching Container", pages: "pp. 47–74" },
      { num: 4, title: "Pricing Your Program with Confidence", pages: "pp. 75–98" },
      { num: 5, title: "The Magnetic Discovery Call", pages: "pp. 99–126" },
      { num: 6, title: "Launching to a Small (But Mighty) Audience", pages: "pp. 127–150" },
      { num: 7, title: "Delivering Transformative Results", pages: "pp. 151–168" },
    ],
    chapterPreview: {
      chapter: "Bölüm 5",
      title: "The Magnetic Discovery Call",
      text: `The discovery call has earned a bad reputation — and for good reason. Most coaches approach it as a sales call with coaching packaging. Their clients sense this immediately, and the result is awkward pauses, objection-handling scripts, and a closing rate that hovers around 20%.

The magnetic alternative reframes the call entirely: your goal is diagnosis, not persuasion. You are a skilled practitioner who helps the prospect clearly see their current situation, the gap they're experiencing, and what becomes possible on the other side. You present your program only after this map is drawn — and only if it genuinely fits.

This shift changes everything. Your energy changes. Their defenses drop. And when you make your offer, it lands as a solution they've already half-chosen rather than a product you're pushing.`,
    },
    kdp: false,
  },
  {
    id: "freelance-pricing",
    category: "Business Playbook",
    language: "English",
    type: "Playbook",
    title: "Freelance Pricing Playbook",
    subtitle: "Stop Undercharging, Start Positioning — The Freelancer's Complete Pricing System",
    summary:
      "Fiyatlandırma odaklı 8 bölümlük rehber, araştırma çıktısıyla destekli. Hedef: yeni ve orta seviye freelancer'lar.",
    tags: ["Araştırma notları", "EPUB önce", "English içerik"],
    spineColor: "#1e3f7a",
    coverGradient: "linear-gradient(155deg,#4a86d4 0%,#1e3f7a 50%,#0a1c40 100%)",
    accentColor: "#6ba0e0",
    textAccent: "#e8f0ff",
    pages: "188",
    time: "3 gün",
    format: "EPUB + PDF + HTML",
    chapters: 8,
    outline: [
      { num: 1, title: "Why Freelancers Undercharge (And How to Stop)", pages: "pp. 1–22" },
      { num: 2, title: "Value-Based Pricing Fundamentals", pages: "pp. 23–48" },
      { num: 3, title: "Packaging Services Into Offers", pages: "pp. 49–74" },
      { num: 4, title: "Raising Your Rates Without Losing Clients", pages: "pp. 75–98" },
      { num: 5, title: "Proposal Psychology & Closing", pages: "pp. 99–124" },
      { num: 6, title: "The Premium Client Acquisition System", pages: "pp. 125–150" },
      { num: 7, title: "Retainers & Recurring Revenue", pages: "pp. 151–170" },
      { num: 8, title: "Building a Six-Figure Freelance Practice", pages: "pp. 171–188" },
    ],
    chapterPreview: {
      chapter: "Bölüm 2",
      title: "Value-Based Pricing Fundamentals",
      text: `Here is the uncomfortable arithmetic of freelancing: if your client pays you $2,000 for a landing page that generates $40,000 in revenue, you captured 5% of the value you created. The client is delighted. You are underpaid. This is the natural state of cost-based pricing — and it is entirely optional.

Value-based pricing begins with a single question: what is the measurable outcome of my work worth to this client? Not what does it cost me to produce, not what does the market charge on average — what is the specific, measurable outcome worth to this specific client?

To answer this, you need to have a conversation before you write a proposal. You need to ask about the context, the stakes, the cost of not solving this problem. Most freelancers skip this conversation. That skip is costing them half their income.`,
    },
    kdp: false,
  },
];

const categories = ["Tümü", "Eğitim Kitabı", "Business Playbook", "Uzmanlık Rehberi"];
const languages = ["Tümü", "English", "Türkçe"];

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

/* ─────────────────────────────────────────────
   BOOK COVER — 3D perspective card
───────────────────────────────────────────── */

function BookCover({
  item,
  size = "md",
}: {
  item: (typeof showcases)[0];
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: { w: "w-16", h: "h-[88px]", spine: "w-3" },
    md: { w: "w-24", h: "h-[136px]", spine: "w-4" },
    lg: { w: "w-32", h: "h-[184px]", spine: "w-5" },
  }[size];

  return (
    <div className="flex">
      {/* Spine */}
      <div
        className={cn(dims.spine, dims.h, "rounded-l-sm flex-shrink-0 shadow-inner")}
        style={{
          background: `linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.1))`,
          backgroundColor: item.spineColor,
        }}
      />
      {/* Cover face */}
      <div
        className={cn(dims.w, dims.h, "relative overflow-hidden rounded-r-sm shadow-2xl")}
        style={{
          background: item.coverGradient,
          transform: "perspective(600px) rotateY(-6deg)",
          transformOrigin: "left center",
        }}
      >
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
        {/* Decorative lines */}
        <div
          className="absolute inset-x-3 top-3 h-px opacity-30"
          style={{ backgroundColor: item.textAccent }}
        />
        <div
          className="absolute inset-x-3 bottom-8 h-px opacity-20"
          style={{ backgroundColor: item.textAccent }}
        />
        {/* Title text on cover */}
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div
            className="text-[7px] font-bold leading-tight tracking-wide opacity-90 line-clamp-3"
            style={{ color: item.textAccent, fontFamily: "var(--font-serif)" }}
          >
            {item.title}
          </div>
          <div
            className="text-[6px] uppercase tracking-widest opacity-60"
            style={{ color: item.textAccent }}
          >
            BOOK GEN
          </div>
        </div>
        {/* Bottom spine gloss */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   OUTLINE PREVIEW MODAL
───────────────────────────────────────────── */

function OutlineModal({
  item,
  onClose,
}: {
  item: (typeof showcases)[0];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"outline" | "chapter" | "export">("outline");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div
          className="relative flex items-center gap-5 p-6 border-b border-border/60"
          style={{ background: item.coverGradient }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          <div className="relative flex-shrink-0">
            <BookCover item={item} size="sm" />
          </div>
          <div className="relative flex-1 min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-1"
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
            <p
              className="mt-1 text-xs leading-relaxed opacity-80 line-clamp-2"
              style={{ color: item.textAccent }}
            >
              {item.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative flex-shrink-0 rounded-full p-2 transition hover:bg-black/20"
            style={{ color: item.textAccent }}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60 bg-background/50">
          {(["outline", "chapter", "export"] as const).map((tab) => {
            const labels = { outline: "İçindekiler", chapter: "Bölüm Önizleme", export: "Export" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 text-xs font-semibold tracking-wide transition-colors border-b-2",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "outline" && (
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5">
                  <Layers className="size-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">
                    {item.chapters} Bölüm · {item.pages} sayfa
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1.5">
                  <Globe className="size-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.language}</span>
                </div>
              </div>
              <div className="space-y-1">
                {item.outline.map((ch) => (
                  <div
                    key={ch.num}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 transition hover:bg-accent/40"
                  >
                    <span
                      className="flex size-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                      style={{ backgroundColor: item.spineColor }}
                    >
                      {ch.num}
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">{ch.title}</span>
                    <span className="text-xs text-muted-foreground">{ch.pages}</span>
                  </div>
                ))}
              </div>
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
                <h4
                  className="mt-3 font-serif text-xl font-semibold text-foreground"
                >
                  {item.chapterPreview.title}
                </h4>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/60 p-5">
                <div className="prose prose-sm max-w-none">
                  {item.chapterPreview.text.split("\n\n").map((para, i) => (
                    <p key={i} className="mb-4 text-sm leading-7 text-foreground last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: "8%", backgroundColor: item.spineColor }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">~{item.pages} sayfanın başı</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-serif text-lg font-semibold text-foreground">
                  Teslim Formatları
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tüm formatlar tek tıkla indirilebilir hâlde üretilir.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    fmt: "EPUB",
                    desc: "E-okuyucu & KDP uyumlu",
                    size: "2.4 MB",
                    ready: true,
                    icon: BookOpen,
                  },
                  {
                    fmt: "PDF",
                    desc: "Baskı kalitesi, tam layout",
                    size: "4.1 MB",
                    ready: true,
                    icon: FileText,
                  },
                  {
                    fmt: "HTML",
                    desc: "Web embed için optimize",
                    size: "310 KB",
                    ready: item.format.includes("HTML"),
                    icon: Globe,
                  },
                ].map((f) => (
                  <div
                    key={f.fmt}
                    className={cn(
                      "relative rounded-2xl border p-4 transition",
                      f.ready
                        ? "border-border/80 bg-background hover:bg-accent/30"
                        : "border-dashed border-border/50 bg-muted/20 opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex size-9 items-center justify-center rounded-xl"
                        style={{ backgroundColor: f.ready ? item.spineColor : undefined, opacity: f.ready ? 1 : 0.4 }}
                      >
                        <f.icon className="size-4 text-white" />
                      </div>
                      {f.ready && (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-bold text-foreground">.{f.fmt}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{f.desc}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{f.size}</span>
                      {f.ready && (
                        <button
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                          style={{ backgroundColor: item.spineColor }}
                        >
                          <Download className="size-3" />
                          İndir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-border/80 bg-background/60 p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 flex-shrink-0 text-emerald-500" />
                  KDP (Kindle Direct Publishing) boyut ve format gereksinimlerine uygundur.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-border/60 bg-background/80 p-4">
          <Link
            href="/start/topic"
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 px-5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
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

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */

export function ExamplesShowcase() {
  const [activeCategory, setActiveCategory] = useState("Tümü");
  const [activeLang, setActiveLang] = useState("Tümü");
  const [previewItem, setPreviewItem] = useState<(typeof showcases)[0] | null>(null);
  const [topic, setTopic] = useState("");

  const filtered = showcases.filter((s) => {
    const catMatch = activeCategory === "Tümü" || s.category === activeCategory;
    const langMatch = activeLang === "Tümü" || s.language === activeLang;
    return catMatch && langMatch;
  });

  return (
    <>
      {/* ── Gallery ── */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kategori
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="h-px w-px hidden sm:block" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dil
              </span>
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    activeLang === lang
                      ? "bg-foreground text-background shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Cover area */}
                <div
                  className="relative flex h-44 items-end justify-between px-5 pb-5 pt-5"
                  style={{ background: item.coverGradient }}
                >
                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />

                  {/* Left: category + lang badges */}
                  <div className="relative z-10 flex flex-col gap-2">
                    <span
                      className="self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.18)",
                        color: item.textAccent,
                        border: `1px solid rgba(255,255,255,0.25)`,
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

                  {/* Right: 3-D book */}
                  <div className="relative z-10 flex-shrink-0">
                    <BookCover item={item} size="md" />
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <h3
                    className="font-serif text-base font-semibold leading-tight text-foreground"
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground line-clamp-2">
                    {item.subtitle}
                  </p>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Sayfa", value: item.pages },
                      { label: "Süre", value: item.time },
                      { label: "Format", value: item.format.split(" ")[0] },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border/80 bg-background px-2 py-2"
                      >
                        <div className="text-xs font-bold text-foreground">{value}</div>
                        <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/80 bg-accent/60 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.kdp && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                        KDP uyumlu
                      </span>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="mt-auto pt-4 border-t border-border/60 mt-4 flex gap-2">
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
              <div className="text-5xl mb-4">📚</div>
              <p className="text-base font-medium text-foreground">Bu filtre için örnek yok</p>
              <p className="mt-2 text-sm text-muted-foreground">Farklı bir kategori veya dil seç.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Interactive topic input ── */}
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
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && topic.trim()) {
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
          <p className="mt-3 text-xs text-muted-foreground">
            Ücretsiz önizleme · Kayıt gerekmez
          </p>
        </div>
      </section>

      {/* ── Production pipeline ── */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Üretim zinciri"
            title="Outline'dan export'a kadar görülebilir akış"
            description="Her adım ayrı bir ekran. Nerede olduğunu, ne geldiğini her zaman bilirsin."
          />

          <div className="relative">
            {/* Connector line - desktop */}
            <div className="absolute inset-x-0 top-10 hidden h-px bg-border/60 md:block" />

            <div className="grid gap-4 md:grid-cols-5">
              {pipeline.map((step, i) => (
                <div key={step.step} className="relative flex flex-col items-start md:items-center">
                  {/* Step number bubble */}
                  <div className="relative z-10 flex size-10 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm mb-4">
                    <step.icon className="size-4 text-primary" />
                  </div>

                  {/* Card */}
                  <div className="w-full rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                      {step.step}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                    {i === pipeline.length - 1 && (
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

      {/* Modal */}
      {previewItem && (
        <OutlineModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}
    </>
  );
}
