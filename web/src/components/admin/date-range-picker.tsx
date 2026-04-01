"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DateRangePicker({
  fromKey = "from",
  toKey = "to",
}: {
  fromKey?: string;
  toKey?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get(fromKey) || "";
  const to = searchParams.get(toKey) || "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(event) => update(fromKey, event.target.value)}
        className="h-11 rounded-2xl border border-[color:var(--admin-border)] bg-white/70 px-3 text-sm text-[color:var(--admin-text)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] dark:bg-white/5"
      />
      <span className="admin-muted text-sm">→</span>
      <input
        type="date"
        value={to}
        onChange={(event) => update(toKey, event.target.value)}
        className="h-11 rounded-2xl border border-[color:var(--admin-border)] bg-white/70 px-3 text-sm text-[color:var(--admin-text)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] dark:bg-white/5"
      />
    </div>
  );
}
