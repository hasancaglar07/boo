import { z } from "zod";

import { detailResponse, mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { getAdminBillingRecord } from "@/lib/admin/queries";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["refund", "void"]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const record = await getAdminBillingRecord((await params).id);
  if (!record) {
    return Response.json({ ok: false, error: "Fatura bulunamadı." }, { status: 404 });
  }
  return detailResponse({
    item: {
      id: record.id,
      planId: record.planId,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      kind: record.kind,
      description: record.description,
      createdAt: record.createdAt.toISOString(),
    },
    related: {
      user: record.user,
      entitlement: record.entitlement,
    },
    permissions: {
      canRefund: record.status === "paid",
      canVoid: record.status !== "void",
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Geçersiz fatura işlemi." }, { status: 400 });
  }

  const id = (await params).id;
  const record = await prisma.billingRecord.findUnique({
    where: { id },
    include: { entitlement: true },
  });
  if (!record) {
    return Response.json({ ok: false, error: "Fatura bulunamadı." }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextStatus = parsed.data.action === "refund" ? "refunded" : "void";
    const billing = await tx.billingRecord.update({
      where: { id },
      data: { status: nextStatus },
    });

    if (record.entitlementId && parsed.data.action === "refund") {
      await tx.entitlement.update({
        where: { id: record.entitlementId },
        data: {
          status: "refunded",
          endsAt: new Date(),
        },
      });
    }

    return billing;
  });

  await audit({
    action: `admin.billing.${parsed.data.action}`,
    entityType: "billing_record",
    entityId: updated.id,
    actorUserId: session.user.id,
    metadata: {
      entitlementId: record.entitlementId,
      planId: updated.planId,
    },
  });

  return mutationResponse({
    id: updated.id,
    status: updated.status,
  });
}
