/**
 * Preview Page Loading Skeletons
 *
 * Provides polished loading states for the preview page
 * with shimmer animations for better perceived performance.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Hero section loading skeleton
 */
export function PreviewHeroSkeleton() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Status Banner Skeleton */}
        <div className="mb-8 flex justify-center">
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>

        {/* Book Cover Skeleton */}
        <div className="mb-8 flex justify-center">
          <Skeleton className="h-96 w-72 rounded-lg shadow-2xl" />
        </div>

        {/* Title & Author Skeleton */}
        <div className="mb-8 text-center space-y-3">
          <Skeleton className="mx-auto h-12 w-3/4 max-w-2xl" />
          <Skeleton className="mx-auto h-6 w-1/2 max-w-lg" />
          <Skeleton className="mx-auto h-4 w-1/3" />
        </div>

        {/* Buttons Skeleton */}
        <div className="flex flex-wrap justify-center gap-4">
          <Skeleton className="h-14 w-40 rounded-lg" />
          <Skeleton className="h-14 w-40 rounded-lg" />
          <Skeleton className="h-14 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Chapter preview loading skeleton
 */
export function ChapterPreviewSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Section Header */}
      <div className="mb-6 flex justify-center">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Chapter Content */}
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardContent className="p-8 md:p-12 space-y-4">
          {/* Chapter Title */}
          <Skeleton className="h-8 w-3/4 mb-6" />

          {/* Chapter Content Lines */}
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 ${i % 3 === 0 ? "w-3/4" : "w-full"}`}
              />
            ))}
          </div>

          {/* Extra spacing */}
          <div className="space-y-3 mt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-4 ${i % 2 === 0 ? "w-2/3" : "w-full"}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Upgrade card loading skeleton
 */
export function UpgradeCardSkeleton() {
  return (
    <Card className="mt-8 max-w-3xl mx-auto border-2 border-primary/20">
      <CardContent className="p-8 text-center space-y-4">
        {/* Heading */}
        <Skeleton className="mx-auto h-8 w-2/3" />

        {/* Description */}
        <Skeleton className="mx-auto h-6 w-3/4" />

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Skeleton className="mx-auto h-14 w-48 rounded-lg" />
      </CardContent>
    </Card>
  );
}

/**
 * Full page loading skeleton
 */
export function PreviewPageSkeleton() {
  return (
    <div className="min-h-screen">
      <PreviewHeroSkeleton />
      <ChapterPreviewSkeleton />
      <UpgradeCardSkeleton />
    </div>
  );
}

/**
 * Compact loading skeleton for inline use
 */
export function CompactPreviewSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-4">
          {/* Book cover thumbnail */}
          <Skeleton className="size-20 rounded-lg flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>

          {/* Status */}
          <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
        </div>

        {/* Progress bar */}
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Shimmer effect component
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] ${className || ""}`}
      style={{
        animation: "shimmer 2s infinite",
      }}
    />
  );
}

// Add shimmer keyframes to global CSS if not already present
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
