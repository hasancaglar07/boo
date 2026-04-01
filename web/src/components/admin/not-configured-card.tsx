"use client";

import { Wrench } from "lucide-react";

export function NotConfiguredCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="admin-panel rounded-[24px] px-6 py-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]">
        <Wrench className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[color:var(--admin-text)]">{title}</h3>
      <p className="mt-2 text-sm admin-muted">{description}</p>
    </div>
  );
}
