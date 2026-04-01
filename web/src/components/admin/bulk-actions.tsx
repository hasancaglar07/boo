"use client";

export function BulkActions({
  selectedCount,
  actions,
  onClear,
}: {
  selectedCount: number;
  actions: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  onClear: () => void;
}) {
  if (!selectedCount) return null;

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-[20px] border border-[color:var(--admin-border)] bg-[color:var(--admin-primary-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-semibold text-[color:var(--admin-text)]">{selectedCount} kayıt seçildi</div>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="rounded-xl border border-[color:var(--admin-border)] bg-white/70 px-3 py-2 text-sm font-medium text-[color:var(--admin-text)] transition hover:bg-white disabled:opacity-50 dark:bg-white/8"
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--admin-primary)]"
        >
          Seçimi temizle
        </button>
      </div>
    </div>
  );
}
