"use client";

import { Fragment, useState } from "react";
import { Share2, Gift, MousePointerClick, Users, Trophy, ChevronDown, ChevronUp, DollarSign, Wallet } from "lucide-react";

import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminDate, formatAdminNumber } from "@/lib/admin/format";

type ConversionRow = {
  newUserId: string;
  newUserEmail: string | null;
  newUserName: string | null;
  convertedAt: string;
  rewardGranted: boolean;
};

type PayoutRow = {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  metadata: { method?: string; email?: string } | null;
};

type ReferrerRow = {
  id: string;
  code: string;
  clicks: number;
  conversions: number;
  rewardsGranted: number;
  createdAt: string;
  totalCommission: number;
  paidOut: number;
  pendingPayout: number;
  balance: number;
  user: { id: string; name: string | null; email: string };
  latestConversions: ConversionRow[];
  payoutRequests: PayoutRow[];
};

type ReferralPayload = {
  summary: {
    totalCodes: number;
    totalClicks: number;
    totalConversions: number;
    rewardedConversions: number;
    conversionRate: number;
    totalCommissionPaid: number;
  };
  referrers: ReferrerRow[];
};

export default function AdminReferralsPage() {
  const { data, loading, error } = useAdminResource<ReferralPayload>("/api/admin/referrals");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (error) {
    return <div className="admin-panel rounded-[24px] px-6 py-10 text-sm text-rose-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Referrals</h1>
        <p className="mt-1 text-sm admin-muted">Referral program istatistikleri ve dönüşüm detayları.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          title="Toplam Kod"
          value={loading || !data ? "—" : formatAdminNumber(data.summary.totalCodes)}
          icon={<Share2 className="size-5" />}
        />
        <MetricCard
          title="Toplam Tıklanma"
          value={loading || !data ? "—" : formatAdminNumber(data.summary.totalClicks)}
          icon={<MousePointerClick className="size-5" />}
          color="primary"
        />
        <MetricCard
          title="Dönüşüm"
          value={loading || !data ? "—" : formatAdminNumber(data.summary.totalConversions)}
          icon={<Users className="size-5" />}
          color="success"
        />
        <MetricCard
          title="Dönüşüm Oranı"
          value={loading || !data ? "—" : `%${data.summary.conversionRate}`}
          icon={<Trophy className="size-5" />}
          color="warning"
        />
        <MetricCard
          title="Ödül Verildi"
          value={loading || !data ? "—" : formatAdminNumber(data.summary.rewardedConversions)}
          icon={<Gift className="size-5" />}
          color="success"
        />
        <MetricCard
          title="Toplam Komisyon"
          value={loading || !data ? "—" : `$${data.summary.totalCommissionPaid.toFixed(2)}`}
          icon={<DollarSign className="size-5" />}
          color="primary"
        />
      </section>

      <div className="admin-panel rounded-[28px] p-5">
        <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Referral Tablosu</div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-black/5 dark:bg-white/8" />
            ))}
          </div>
        )}

        {!loading && !data?.referrers.length && (
          <div className="rounded-2xl border border-dashed border-[color:var(--admin-border)] px-6 py-10 text-center text-sm admin-muted">
            Henüz referral kodu yok.
          </div>
        )}

        {!loading && (data?.referrers || []).length > 0 && (
          <div className="admin-panel admin-scrollbar overflow-x-auto rounded-[22px]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/5 dark:border-white/8">
                <tr>
                  {["Kullanıcı", "Kod", "Tıklanma", "Dönüşüm", "Toplam Kazanç", "Ödenen", "Bakiye", "Ödül", "Oluşturma", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/8">
                {(data?.referrers || []).map((row) => (
                  <Fragment key={row.id}>
                    <tr className="transition hover:bg-black/3 dark:hover:bg-white/3">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-[color:var(--admin-text)]">{row.user.name || "—"}</div>
                        <div className="mt-0.5 text-xs admin-muted">{row.user.email}</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="font-mono text-sm font-semibold tracking-widest text-[color:var(--admin-primary)]">
                          {row.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">{formatAdminNumber(row.clicks)}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[color:var(--admin-text)]">{row.conversions}</span>
                          {row.conversions > 0 && (
                            <StatusBadge
                              status="success"
                              label={`%${Math.round((row.conversions / Math.max(row.clicks, 1)) * 100)}`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="font-semibold text-[color:var(--admin-primary)]">
                          ${row.totalCommission.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-[color:var(--admin-text)]">${row.paidOut.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ${row.balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {row.rewardsGranted > 0 ? (
                          <StatusBadge status="success" label={`${row.rewardsGranted} verildi`} />
                        ) : (
                          <span className="text-xs admin-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-xs admin-muted whitespace-nowrap">
                        {formatAdminDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {(row.latestConversions.length > 0 || row.payoutRequests.length > 0) && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-[color:var(--admin-primary)] hover:underline"
                            onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                          >
                            {expanded === row.id ? (
                              <><ChevronUp className="size-3.5" />Gizle</>
                            ) : (
                              <><ChevronDown className="size-3.5" />Detaylar</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr>
                        <td colSpan={10} className="bg-black/2 dark:bg-white/3 px-4 py-3">
                          <div className="grid gap-4 lg:grid-cols-2">
                            {/* Conversions */}
                            <div>
                              <div className="mb-2 text-xs font-semibold uppercase tracking-widest admin-muted">Son Dönüşümler</div>
                              <div className="space-y-2">
                                {row.latestConversions.map((c) => (
                                  <div
                                    key={c.newUserId}
                                    className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] bg-white/60 px-4 py-2 text-sm dark:bg-white/5"
                                  >
                                    <div>
                                      <div className="font-medium text-[color:var(--admin-text)]">
                                        {c.newUserName || c.newUserEmail || c.newUserId}
                                      </div>
                                      <div className="text-xs admin-muted">{formatAdminDate(c.convertedAt)}</div>
                                    </div>
                                    <StatusBadge
                                      status={c.rewardGranted ? "success" : "warning"}
                                      label={c.rewardGranted ? "Ödül verildi" : "Bekliyor"}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Payout requests */}
                            <div>
                              <div className="mb-2 text-xs font-semibold uppercase tracking-widest admin-muted">
                                <Wallet className="inline size-3 mr-1" />
                                Ödeme Talepleri
                              </div>
                              <div className="space-y-2">
                                {row.payoutRequests.length === 0 && (
                                  <div className="text-xs admin-muted">Henüz talep yok.</div>
                                )}
                                {row.payoutRequests.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] bg-white/60 px-4 py-2 text-sm dark:bg-white/5"
                                  >
                                    <div>
                                      <div className="font-medium text-[color:var(--admin-text)]">
                                        ${p.amount.toFixed(2)}
                                      </div>
                                      <div className="text-xs admin-muted">
                                        {p.metadata?.method || "—"} · {p.metadata?.email || "—"}
                                      </div>
                                      <div className="text-xs admin-muted">{formatAdminDate(p.date)}</div>
                                    </div>
                                    <StatusBadge
                                      status={p.status === "paid" ? "success" : p.status === "open" || p.status === "draft" ? "warning" : "default"}
                                      label={p.status === "paid" ? "Ödendi" : p.status === "open" ? "Bekliyor" : p.status === "void" ? "İptal" : p.status}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
