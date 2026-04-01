"use client";

import React, { useEffect, useRef, useState, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface GalleryItem {
  title: string;
  author: string;
  subtitle: string;
  cover: {
    gradient: string;
    label?: string;
    stamp?: string;
    textColor?: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  radius?: number;
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 430, autoRotateSpeed = 0.018, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [resolvedRadius, setResolvedRadius] = useState(radius);
    const scrollTimeoutRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
      const updateRadius = () => {
        const width = window.innerWidth;
        if (width < 640) {
          setResolvedRadius(215);
          return;
        }
        if (width < 1024) {
          setResolvedRadius(Math.min(radius, 320));
          return;
        }
        setResolvedRadius(radius);
      };

      updateRadius();
      window.addEventListener("resize", updateRadius);
      return () => window.removeEventListener("resize", updateRadius);
    }, [radius]);

    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          window.clearTimeout(scrollTimeoutRef.current);
        }

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        setRotation(scrollProgress * 360);

        scrollTimeoutRef.current = window.setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) {
          setRotation((previous) => previous + autoRotateSpeed);
        }
        animationFrameRef.current = window.requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = window.requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [autoRotateSpeed, isScrolling]);

    if (!items.length) {
      return null;
    }

    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Dönen kitap vitrini"
        className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", className)}
        style={{ perspective: "2200px" }}
        {...props}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, index) => {
            const itemAngle = index * anglePerItem;
            const totalRotation = ((rotation % 360) + 360) % 360;
            const relativeAngle = (itemAngle + totalRotation) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.34, 1 - normalizedAngle / 190);
            const scale = 0.86 + Math.max(0, 1 - normalizedAngle / 180) * 0.18;

            return (
              <div
                key={`${item.title}-${item.author}`}
                role="group"
                aria-label={item.title}
                className="absolute left-1/2 top-1/2 h-[300px] w-[220px] sm:h-[340px] sm:w-[250px] lg:h-[390px] lg:w-[280px]"
                style={{
                  transform: `translate(-50%, -50%) rotateY(${itemAngle}deg) translateZ(${resolvedRadius}px) scale(${scale})`,
                  opacity,
                  transition: "opacity 0.35s linear, transform 0.35s linear",
                  transformStyle: "preserve-3d",
                }}
              >
                <article
                  className="relative h-full w-full overflow-hidden rounded-[28px] border border-border/80 bg-card/70 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="absolute inset-0" style={{ background: item.cover.gradient }} />
                  <div className="absolute inset-[1px] rounded-[27px] bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_28%,rgba(0,0,0,0.28)_100%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_34%)] opacity-80" />

                  <div
                    className="relative flex h-full flex-col justify-between p-5 sm:p-6"
                    style={{ color: item.cover.textColor || "#ffffff" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {item.cover.label ? (
                        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.24em] backdrop-blur">
                          {item.cover.label}
                        </span>
                      ) : (
                        <span />
                      )}
                      {item.cover.stamp ? (
                        <span className="text-[10px] font-medium uppercase tracking-[0.26em] opacity-70">
                          {item.cover.stamp}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] opacity-70">
                        {item.subtitle}
                      </p>
                      <h3 className="max-w-[11ch] font-serif text-[2rem] leading-[0.98] sm:text-[2.3rem]">
                        {item.title}
                      </h3>
                      <p className="mt-6 text-sm font-medium opacity-85">{item.author}</p>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
