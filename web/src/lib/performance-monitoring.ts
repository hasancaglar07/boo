/**
 * Performance Monitoring Utilities
 *
 * Tracks Web Vitals and performance metrics for the preview page.
 * Uses the Web Vitals API and PerformanceObserver API.
 */

import { trackEvent } from "./analytics";

type MetricCallback = (metric: {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}) => void;

/**
 * Core Web Vitals thresholds
 */
const VITAL_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FTT: { good: 100, poor: 200 }, // First Tap Time
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
} as const;

/**
 * Rate performance metric
 */
function rateMetric(
  name: keyof typeof VITAL_THRESHOLDS,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = VITAL_THRESHOLDS[name];
  if (!thresholds) return "good";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.poor) return "needs-improvement";
  return "poor";
}

/**
 * Track Web Vitals
 */
export function trackWebVitals(slug: string) {
  if (typeof window === "undefined") return;

  // Track Largest Contentful Paint (LCP)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          const lcp = lastEntry.renderTime || lastEntry.loadTime;
          const rating = rateMetric("LCP", lcp);

          trackEvent("performance_lcp", {
            slug,
            value: Math.round(lcp),
            rating,
          });
        }
      });

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (e) {
      console.warn("LCP tracking failed:", e);
    }

    // Track First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          const rating = rateMetric("FID", fid);

          trackEvent("performance_fid", {
            slug,
            value: Math.round(fid),
            rating,
          });
        });
      });

      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (e) {
      console.warn("FID tracking failed:", e);
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        const rating = rateMetric("CLS", clsValue);
        trackEvent("performance_cls", {
          slug,
          value: Math.round(clsValue * 1000) / 1000,
          rating,
        });
      });

      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (e) {
      console.warn("CLS tracking failed:", e);
    }

    // Track First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries[0].startTime;
        const rating = rateMetric("FCP", fcp);

        trackEvent("performance_fcp", {
          slug,
          value: Math.round(fcp),
          rating,
        });
      });

      fcpObserver.observe({ entryTypes: ["paint"] });
    } catch (e) {
      console.warn("FCP tracking failed:", e);
    }
  }
}

/**
 * Track page load time
 */
export function trackPageLoad(slug: string) {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    // Wait a bit for all metrics to be collected
    setTimeout(() => {
      const perfData = performance.getEntriesByType("navigation")[0] as any;

      if (perfData) {
        const metrics = {
          dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
          tcp: Math.round(perfData.connectEnd - perfData.connectStart),
          ttfb: Math.round(perfData.responseStart - perfData.requestStart),
          download: Math.round(perfData.responseEnd - perfData.responseStart),
          dom_load: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
          window_load: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
          total_load: Math.round(perfData.loadEventEnd - perfData.fetchStart),
        };

        trackEvent("performance_page_load", {
          slug,
          ...metrics,
        });
      }
    }, 1000);
  });
}

/**
 * Track resource loading times
 */
export function trackResourceLoading(slug: string) {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  try {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: any) => {
        // Only track significant resources
        if (entry.duration > 100) {
          trackEvent("performance_resource_load", {
            slug,
            resource_type: entry.initiatorType,
            resource_name: entry.name,
            duration: Math.round(entry.duration),
            size: entry.transferSize ? Math.round(entry.transferSize / 1024) : undefined,
          });
        }
      });
    });

    resourceObserver.observe({ entryTypes: ["resource"] });
  } catch (e) {
    console.warn("Resource tracking failed:", e);
  }
}

/**
 * Initialize all performance monitoring
 */
export function initPerformanceMonitoring(slug: string) {
  if (typeof window === "undefined") return;

  // Only track in production
  if (process.env.NODE_ENV === "production") {
    trackWebVitals(slug);
    trackPageLoad(slug);
    trackResourceLoading(slug);
  }
}

/**
 * Measure custom performance marks
 */
export function measurePerformanceMark(
  slug: string,
  markName: string,
  startMark?: string
) {
  if (typeof window === "undefined" || !window.performance) return;

  try {
    const endMark = `${markName}_end`;

    if (startMark) {
      performance.measure(markName, startMark, endMark);
    } else {
      performance.mark(endMark);
      performance.measure(markName, markName, endMark);
    }

    const measure = performance.getEntriesByName(markName)[0] as PerformanceMeasure;

    trackEvent("performance_custom_mark", {
      slug,
      mark_name: markName,
      duration: Math.round(measure.duration),
    });

    // Clean up
    performance.clearMarks(markName);
    performance.clearMarks(endMark);
    performance.clearMeasures(markName);
  } catch (e) {
    console.warn(`Performance mark ${markName} failed:`, e);
  }
}
