import { type NextRequest } from "next/server";

import { requestMeta } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorUserId?: string | null;
  guestIdentityId?: string | null;
  request?: Request | NextRequest;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput) {
  const meta = input.request ? requestMeta(input.request) : { ipHash: null, userAgent: "" };
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      actorUserId: input.actorUserId || null,
      guestIdentityId: input.guestIdentityId || null,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      metadata: (input.metadata || {}) as never,
    },
  });
}
