"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
}

export function BlogToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0% -75% 0%" },
    );

    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table of Contents" className="sticky top-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
        Table of Contents
      </p>
      <ol className="space-y-0.5 border-l border-border">
        {items.map(({ id, title }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block -ml-px border-l-2 py-1 pl-3 text-sm leading-snug transition-colors ${
                active === id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
