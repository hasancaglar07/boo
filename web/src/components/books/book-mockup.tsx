"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type BookMockupProps = {
  title: string;
  subtitle?: string;
  author?: string;
  brand?: string;
  logoUrl?: string;
  imageUrl?: string;
  accentLabel?: string;
  className?: string;
  size?: "md" | "lg" | "xl";
};

function CoverFace({
  title,
  subtitle,
  author,
  brand,
  logoUrl,
  imageUrl,
}: Pick<BookMockupProps, "title" | "subtitle" | "author" | "brand" | "logoUrl" | "imageUrl">) {
  if (imageUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[18px]">
        <Image
          src={imageUrl}
          alt={`${title} kitap kapağı`}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_18%,transparent_82%,rgba(0,0,0,0.08))]" />
        <div className="absolute inset-y-0 left-0 w-[24%] bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent_70%)]" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {logoUrl ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-md border border-white/18 bg-white/10 p-1 backdrop-blur-sm">
              <Image src={logoUrl} alt={`${brand || "Brand"} logosu`} fill className="object-contain p-1" unoptimized />
            </div>
          ) : null}
          <div className="rounded-full border border-white/18 bg-black/18 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/88 backdrop-blur-sm">
            {brand || "Book Generator"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-[18px] bg-[radial-gradient(circle_at_top,_rgba(188,104,67,0.18),_transparent_34%),linear-gradient(180deg,_#261c16_0%,_#523629_52%,_#b96a42_100%)] p-5 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/76">{brand || "Book Generator"}</div>
        {logoUrl ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-md border border-white/16 bg-white/8 p-1">
            <Image src={logoUrl} alt={`${brand || "Brand"} logosu`} fill className="object-contain p-1" unoptimized />
          </div>
        ) : null}
      </div>
      <div>
        <div className="max-w-[9ch] text-2xl font-semibold leading-[1.02]">{title}</div>
        {subtitle ? <div className="mt-3 text-xs leading-6 text-white/82">{subtitle}</div> : null}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/74">{author || "Author"}</div>
    </div>
  );
}

export function BookMockup({
  title,
  subtitle,
  author,
  brand,
  logoUrl,
  imageUrl,
  accentLabel,
  className,
  size = "md",
}: BookMockupProps) {
  const frameClass =
    size === "xl"
      ? "w-[270px] md:w-[330px] lg:w-[380px]"
      : size === "lg"
      ? "w-[250px] md:w-[290px] lg:w-[320px]"
      : "w-[210px] md:w-[240px]";

  return (
    <div className={cn("relative mx-auto", frameClass, className)}>
      <div className="absolute inset-x-[8%] top-[10%] h-[72%] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute inset-x-[20%] bottom-[2%] h-8 rounded-full bg-black/20 blur-xl" />

      <div className="relative" style={{ perspective: "1800px" }}>
        <div
          className="relative aspect-[0.74] [transform-style:preserve-3d]"
          style={{ transform: "rotateY(-24deg) rotateX(8deg) rotateZ(-1.5deg)" }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[16px_22px_40px_rgba(28,18,10,0.22)]">
            <CoverFace
              title={title}
              subtitle={subtitle}
              author={author}
              brand={brand}
              logoUrl={logoUrl}
              imageUrl={imageUrl}
            />
          </div>

          <div
            className="absolute left-0 top-[1.8%] h-[96.4%] w-[18px] rounded-l-[8px] bg-[linear-gradient(180deg,#7b4b35_0%,#42261b_100%)] shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]"
            style={{
              transform: "translateX(-9px) rotateY(90deg)",
              transformOrigin: "left center",
            }}
          >
            <div className="absolute inset-y-[8%] left-[45%] w-px bg-white/20" />
          </div>

          <div
            className="absolute right-0 top-[2.5%] h-[95%] w-[16px] rounded-r-[8px] bg-[linear-gradient(180deg,#f7f2ea_0%,#ede2d2_100%)]"
            style={{
              transform: "translateX(8px) rotateY(-90deg)",
              transformOrigin: "right center",
            }}
          >
            <div className="absolute inset-y-0 left-[35%] w-px bg-stone-300/80" />
            <div className="absolute inset-y-0 left-[55%] w-px bg-stone-300/60" />
            <div className="absolute inset-y-0 left-[75%] w-px bg-stone-300/50" />
          </div>

          <div
            className="absolute bottom-0 left-[1.8%] h-[12px] w-[96.4%] rounded-b-[10px] bg-[linear-gradient(180deg,#f8f4ec_0%,#e8dccb_100%)]"
            style={{
              transform: "translateY(6px) rotateX(-90deg)",
              transformOrigin: "bottom center",
            }}
          />
        </div>
      </div>

      {accentLabel ? (
        <div className="mt-5 flex justify-center">
          <div className="rounded-full border border-border/80 bg-card/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-sm">
            {accentLabel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
