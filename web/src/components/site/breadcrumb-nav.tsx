import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Reusable breadcrumb navigation component
 * Provides consistent breadcrumb structure across all pages
 * Includes schema markup support for AI systems
 */
export function BreadcrumbNav({ items, className = "" }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-8 flex items-center gap-1.5 text-sm text-muted-foreground", className)}
    >
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
          {index === items.length - 1 ? (
            <span className="line-clamp-1 text-foreground" aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link
              href={item.href}
              className="transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
