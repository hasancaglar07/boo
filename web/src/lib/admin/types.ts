export type AdminListResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  appliedFilters: Record<string, string | null>;
};

export type AdminDetailResponse<T, R = Record<string, unknown>> = {
  item: T;
  related: R;
  permissions: Record<string, boolean>;
};

export type AdminMutationResponse<T = Record<string, unknown>> = {
  ok: boolean;
  item?: T;
  error?: string;
  code?: string;
};

export type AdminOverviewPayload = {
  cards: {
    totalUsers: number;
    freeUsers: number;
    paidUsers: number;
    activeSubscriptions: number;
    totalBooks: number;
    mrr: number;
    arr: number;
    funnelConversionRate: number;
  };
  revenueTrend: Array<{ label: string; value: number }>;
  userGrowth: Array<{ label: string; users: number }>;
  conversionSeries: Array<{ label: string; signups: number; paid: number }>;
  planDistribution: Array<{ label: string; value: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    actor: string;
    createdAt: string;
    metadata?: Record<string, unknown> | null;
  }>;
};
