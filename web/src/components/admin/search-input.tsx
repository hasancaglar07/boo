"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function SearchInput({
  queryKey = "q",
  placeholder = "Ara...",
  className,
}: {
  queryKey?: string;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(queryKey) || "";
  const queryString = searchParams.toString();
  const currentHref = queryString ? `${pathname}?${queryString}` : pathname;
  const onReplace = useCallback(
    (href: string) => {
      if (href === currentHref) return;
      router.replace(href);
    },
    [currentHref, router],
  );

  return (
    <SearchInputField
      key={`${pathname}:${queryKey}:${currentValue}`}
      pathname={pathname}
      queryKey={queryKey}
      queryString={queryString}
      initialValue={currentValue}
      placeholder={placeholder}
      className={className}
      onReplace={onReplace}
    />
  );
}

function SearchInputField({
  pathname,
  queryKey,
  queryString,
  initialValue,
  placeholder,
  className,
  onReplace,
}: {
  pathname: string;
  queryKey: string;
  queryString: string;
  initialValue: string;
  placeholder: string;
  className?: string;
  onReplace: (href: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(queryString);
      if (value.trim()) params.set(queryKey, value.trim());
      else params.delete(queryKey);
      params.set("page", "1");
      const nextQuery = params.toString();
      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      onReplace(nextHref);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [onReplace, pathname, queryKey, queryString, value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--admin-muted)]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[color:var(--admin-border)] bg-white/70 pl-9 pr-10 text-sm text-[color:var(--admin-text)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] dark:bg-white/5"
      />
      {value ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--admin-muted)] transition hover:text-[color:var(--admin-text)]"
          onClick={() => setValue("")}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
