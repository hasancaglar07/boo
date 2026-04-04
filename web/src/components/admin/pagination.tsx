"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function go(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 text-sm dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm admin-muted">
        <span>Sayfa başına:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("pageSize", e.target.value);
            params.set("page", "1");
            router.replace(`${pathname}?${params.toString()}`);
          }}
          className="h-8 rounded-xl border border-[color:var(--admin-border)] bg-white/60 px-2 text-sm outline-none dark:bg-white/5"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>{totalItems} kayıt</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1 rounded-2xl border border-[color:var(--admin-border)] px-3 disabled:opacity-40"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
          Önceki
        </button>
        <span className="text-sm font-semibold text-[color:var(--admin-text)]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1 rounded-2xl border border-[color:var(--admin-border)] px-3 disabled:opacity-40"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
        >
          Sonraki
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}