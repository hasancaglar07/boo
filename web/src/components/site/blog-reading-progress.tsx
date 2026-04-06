"use client";

import { useEffect, useState } from "react";

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollY } = window;
      const { scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      setProgress(max > 0 ? (scrollY / max) * 100 : 0);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-label="Reading progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-border"
    >
      <div
        className="h-full bg-primary transition-[width] duration-75 ease-linear will-change-[width]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
