"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

type CoverDesign = {
  title: string;
  author: string;
  badge: string;
  palette: [string, string];
  imageUrl?: string;
};

type FloatingIconItem = {
  id: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className: string;
};

type FloatingCoverItem = {
  id: number;
  cover: CoverDesign;
  className: string;
};

type FloatingAsset = FloatingIconItem | FloatingCoverItem;

function isCoverItem(asset: FloatingAsset): asset is FloatingCoverItem {
  return "cover" in asset;
}

export interface FloatingIconsHeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  assets: FloatingAsset[];
  badge?: string;
  trustNote?: string;
  socialProof?: { count: string; rating: string };
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

const FloatingItem = ({
  mouseX,
  mouseY,
  asset,
  index,
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  asset: FloatingAsset;
  index: number;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 22, mass: 0.8 });
  const springY = useSpring(y, { stiffness: 280, damping: 22, mass: 0.8 });

  React.useEffect(() => {
    let frame = 0;

    const update = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(mouseX.current - centerX, mouseY.current - centerY);

        if (distance < 180) {
          const angle = Math.atan2(mouseY.current - centerY, mouseX.current - centerX);
          const force = (1 - distance / 180) * 46;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
        } else {
          x.set(0);
          y.set(0);
        }
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [mouseX, mouseY, x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.65 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.06,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("pointer-events-none absolute", asset.className)}
    >
      <motion.div
        className={cn(
          "flex items-center justify-center border shadow-sm backdrop-blur-xl",
          isCoverItem(asset)
            ? "h-[88px] w-[64px] overflow-hidden rounded-[12px] border-white/20 md:h-[108px] md:w-[78px]"
            : "h-14 w-14 rounded-[24px] border-border/80 bg-card/80 md:h-16 md:w-16",
        )}
        style={
          isCoverItem(asset)
            ? {
                backgroundImage: asset.cover.imageUrl
                  ? `linear-gradient(160deg, rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.58)), url(${asset.cover.imageUrl}), linear-gradient(150deg, ${asset.cover.palette[0]}, ${asset.cover.palette[1]})`
                  : `linear-gradient(150deg, ${asset.cover.palette[0]}, ${asset.cover.palette[1]})`,
                backgroundSize: "cover, cover, cover",
                backgroundPosition: "center, center, center",
              }
            : undefined
        }
        animate={{
          y: [0, -8, 0, 7, 0],
          x: [0, 5, 0, -5, 0],
          rotate: [0, 4, 0, -4, 0],
        }}
        transition={{
          duration: 4.8 + index * 0.35,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        {isCoverItem(asset) ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.26),transparent_54%)]" />
            {asset.cover.imageUrl ? (
              <>
                <div className="pointer-events-none absolute inset-0 ring-1 ring-white/12" />
                <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/18 bg-black/45 px-2 py-1 text-[6px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                  {asset.cover.badge}
                </div>
              </>
            ) : (
              <div className="relative flex h-full w-full flex-col justify-between p-2">
                <span className="text-[7px] font-medium tracking-[0.18em] text-white/80">{asset.cover.badge}</span>
                <div>
                  <p className="text-[9px] font-semibold leading-[1.25] text-white">{asset.cover.title}</p>
                  <p className="mt-1 text-[7px] tracking-[0.08em] text-white/80">{asset.cover.author}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <asset.icon className="h-6 w-6 text-foreground md:h-7 md:w-7" />
        )}
      </motion.div>
    </motion.div>
  );
};

const FloatingIconsHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & FloatingIconsHeroProps
>(({
  className,
  title,
  subtitle,
  ctaText,
  ctaHref,
  assets,
  badge = "Book OS",
  trustNote,
  socialProof,
  secondaryCtaText,
  secondaryCtaHref,
  ...props
}, ref) => {
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "grid-overlay relative flex min-h-[760px] w-full items-center justify-center overflow-hidden bg-background",
        className,
      )}
      {...props}
    >
      <div className="hero-glow" />

      <div className="absolute inset-0">
        {assets.map((asset, index) => (
          <FloatingItem
            key={asset.id}
            mouseX={mouseX}
            mouseY={mouseY}
            asset={asset}
            index={index}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 text-center">
        {/* Social Proof Bar */}
        {socialProof && (
          <div className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-border/80 bg-card/80 px-5 py-2.5 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="font-semibold text-foreground">{socialProof.rating}</span>
            <span className="h-3.5 w-px bg-border" />
            <span>
              <span className="font-semibold text-foreground">{socialProof.count}</span>
            </span>
          </div>
        )}

        {/* Badge */}
        <div className="mx-auto inline-flex items-center rounded-full border border-border/80 bg-card/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          {badge}
        </div>

        <h1 className="mx-auto mt-8 max-w-5xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-7xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
          {subtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="px-8">
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2"
              onClick={() => trackEvent("landing_hero_cta_click", { href: ctaHref })}
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          {secondaryCtaText && secondaryCtaHref && (
            <Button asChild size="lg" variant="outline" className="px-8">
              <a href={secondaryCtaHref} className="inline-flex items-center gap-2">
                {secondaryCtaText}
              </a>
            </Button>
          )}
        </div>

        {/* Trust Microcopy */}
        {trustNote && (
          <p className="mt-4 text-xs text-muted-foreground/70">
            {trustNote}
          </p>
        )}
      </div>
    </section>
  );
});

FloatingIconsHero.displayName = "FloatingIconsHero";

export { FloatingIconsHero };
