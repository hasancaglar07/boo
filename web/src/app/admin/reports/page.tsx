"use client";

import { useState } from "react";
import { FileText, Download, Users, BookOpen, DollarSign } from "lucide-react";

type ReportConfig = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  baseUrl: string;
  filters: Array<{
    name: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  filename: string;
};

const REPORTS: ReportConfig[] = [
  {
    id: "users",
    title: "User Report",
    description: "All users, plan info, revenue, and registration date.",
    icon: <Users className="size-5" />,
    baseUrl: "/api/admin/reports/users",
    filename: "admin-users.csv",
    filters: [
      {
        name: "plan",
        label: "Plan",
        options: [
          { value: "all", label: "All" },
          { value: "free", label: "Free" },
          { value: "starter", label: "Starter" },
          { value: "creator", label: "Creator" },
          { value: "pro", label: "Pro" },
        ],
      },
      {
        name: "status",
        label: "Durum",
        options: [
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
      {
        name: "role",
        label: "Rol",
        options: [
          { value: "all", label: "All" },
          { value: "USER", label: "User" },
          { value: "ADMIN", label: "Admin" },
        ],
      },
    ],
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Invoice records, filterable by plan and payment status.",
    icon: <DollarSign className="size-5" />,
    baseUrl: "/api/admin/reports/revenue",
    filename: "admin-revenue.csv",
    filters: [
      {
        name: "status",
        label: "Durum",
        options: [
          { value: "all", label: "All" },
          { value: "paid", label: "Paid" },
          { value: "open", label: "Open" },
          { value: "void", label: "Void" },
          { value: "refunded", label: "Refunded" },
        ],
      },
    ],
  },
  {
    id: "books",
    title: "Book Report",
    description: "All book records, creation date, and statuses.",
    icon: <BookOpen className="size-5" />,
    baseUrl: "/api/admin/reports/books",
    filename: "admin-books.csv",
    filters: [
      {
        name: "status",
        label: "Durum",
        options: [
          { value: "all", label: "All" },
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
        ],
      },
    ],
  },
];

function ReportCard({ report }: { report: ReportConfig }) {
  const [filters, setFilters] = useState<Record<string, string>>(
    Object.fromEntries(report.filters.map((f) => [f.name, "all"])),
  );
  const [downloading, setDownloading] = useState(false);

  function buildUrl() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "all") params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `${report.baseUrl}?${qs}` : report.baseUrl;
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const url = buildUrl();
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed.");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = report.filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="admin-panel rounded-[24px] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]">
          {report.icon}
        </div>
        <div>
          <div className="font-semibold text-[color:var(--admin-text)]">{report.title}</div>
          <p className="mt-0.5 text-xs admin-muted">{report.description}</p>
        </div>
      </div>

      {report.filters.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {report.filters.map((filter) => (
            <div key={filter.name}>
              <label className="mb-1.5 block text-xs font-medium admin-muted">{filter.label}</label>
              <select
                value={filters[filter.name] || "all"}
                onChange={(e) => setFilters((prev) => ({ ...prev, [filter.name]: e.target.value }))}
                className="h-9 w-full rounded-xl border border-[color:var(--admin-border)] bg-white/60 px-3 text-sm outline-none focus:border-[color:var(--admin-primary)] dark:bg-white/5"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        <Download className="size-4" />
        {downloading ? "Downloading..." : "Download CSV"}
      </button>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Reports</h1>
        <p className="mt-1 text-sm admin-muted">Data export in CSV format.</p>
      </div>

      <div className="admin-panel rounded-[28px] p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[color:var(--admin-text)]">
          <FileText className="size-4" />
          Available Reports
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </div>
    </div>
  );
}
