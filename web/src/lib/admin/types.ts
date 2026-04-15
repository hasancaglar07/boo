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

export type AdminLiveActivityPayload = {
  snapshotAt: string;
  summary: {
    concurrentOperations: number;
    activeUsers: number;
    activeBooks: number;
    booksGeneratingNow: number;
    queueDepth: number;
    failedLastHour: number;
  };
  health: {
    status: "healthy" | "degraded" | "down";
    backendReachable: boolean;
    staleOperations: number;
    errorRatePct: number;
    alerts: string[];
  };
  providers: Array<{
    provider: string;
    active: number;
    total: number;
  }>;
  apiUsage: Array<{
    api: string;
    inFlight: number;
    total: number;
    errors: number;
    lastRequestAt: string | null;
  }>;
  operations: Array<{
    id: string;
    bookSlug: string;
    title: string;
    owner: string;
    lifecycle: "processing" | "pending" | "failed" | "completed";
    stage: string;
    stepCode: string;
    progress: number;
    message: string;
    provider: string;
    api: string;
    startedAt: string;
    updatedAt: string;
    stale: boolean;
  }>;
};
