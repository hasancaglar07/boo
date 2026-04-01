"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

import { cn } from "@/lib/utils";

export function ExampleCoverArtwork({
  title,
  brandingMark,
  primaryUrl,
  fallbackUrl,
  spineColor,
  coverGradient,
  textAccent,
  className,
  coverClassName,
  imageClassName,
}: {
  title: string;
  brandingMark?: string;
  primaryUrl?: string;
  fallbackUrl?: string;
  spineColor: string;
  coverGradient: string;
  textAccent: string;
  className?: string;
  coverClassName?: string;
  imageClassName?: string;
}) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const activeSrc =
    !primaryFailed && primaryUrl
      ? primaryUrl
      : !fallbackFailed && fallbackUrl
        ? fallbackUrl
        : undefined;

  return (
    <div className={cn("flex", className)}>
      <div
        className="w-[10%] rounded-l-[10px] shadow-inner"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, black 42%, transparent), color-mix(in srgb, white 8%, transparent))",
          backgroundColor: spineColor,
        }}
      />
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-r-[14px] shadow-[0_24px_60px_rgba(15,23,42,0.24)]",
          coverClassName,
        )}
        style={{
          background: coverGradient,
          transform: "perspective(900px) rotateY(-8deg)",
          transformOrigin: "left center",
        }}
      >
        {activeSrc ? (
          <>
            <img
              src={activeSrc}
              alt={`${title} cover`}
              className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)}
              onError={() => {
                if (activeSrc === primaryUrl) setPrimaryFailed(true);
                if (activeSrc === fallbackUrl) setFallbackFailed(true);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/8 to-white/10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_32%)]" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <div
                className="max-w-[12ch] text-lg font-semibold leading-[1.02]"
                style={{ color: textAccent, fontFamily: "var(--font-serif)" }}
              >
                {title}
              </div>
              {brandingMark ? (
                <div
                  className="inline-flex self-start rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  style={{
                    color: textAccent,
                    borderColor: "rgba(255,255,255,0.32)",
                    backgroundColor: "rgba(0,0,0,0.18)",
                  }}
                >
                  {brandingMark}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
