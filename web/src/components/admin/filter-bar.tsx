"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DateRangePicker } from "@/components/admin/date-range-picker";
import { SearchInput } from "@/components/admin/search-input";

type FilterOption = {
  label: string;
  value: string;
};

type FilterConfig = {
  key: string;
  label: string;
  options: FilterOption[];
};

export function FilterBar({
  searchPlaceholder,
  filters = [],
  withDateRange = true,
}: {
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  withDateRange?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ["q", "from", "to", "page", ...filters.map((filter) => filter.key)].forEach((key) => params.delete(key));
    router.replace(`${pathname}?${params.toString()}`);
  }

  const activeFilters = filters
    .map((filter) => ({
      key: filter.key,
      label: filter.label,
      value: searchParams.get(filter.key) || "",
    }))
    .filter((item) => item.value);

  return (
    <div className="admin-panel rounded-[24px] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput placeholder={searchPlaceholder} />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <label key={filter.key} className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.14em] admin-muted">
              {filter.label}
              <select
                value={searchParams.get(filter.key) || "all"}
                onChange={(event) => update(filter.key, event.target.value)}
                className="h-11 min-w-[150px] rounded-2xl border border-[color:var(--admin-border)] bg-white/70 px-3 text-sm font-medium text-[color:var(--admin-text)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] dark:bg-white/5"
              >
                <option value="all">Tümü</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {withDateRange ? <DateRangePicker /> : null}
        </div>
      </div>

      {(activeFilters.length > 0 || searchParams.get("q") || searchParams.get("from") || searchParams.get("to")) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {searchParams.get("q") ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--admin-primary-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--admin-primary)]">
              Arama: {searchParams.get("q")}
              <button
                type="button"
                onClick={() => update("q", "")}
                className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-[color:var(--admin-primary-soft)]"
                aria-label="Aramayı temizle"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}
          {activeFilters.map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[color:var(--admin-text)] dark:bg-white/8"
            >
              {item.label}: {item.value}
              <button
                type="button"
                onClick={() => update(item.key, "")}
                className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                aria-label={`${item.label} filtresini kaldır`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-[color:var(--admin-primary)] underline-offset-4 hover:underline"
            onClick={clearAll}
          >
            Filtreleri temizle
          </button>
        </div>
      )}
    </div>
  );
}