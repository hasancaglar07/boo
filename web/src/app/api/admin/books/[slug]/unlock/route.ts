import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { unlockBookPremium } from "@/lib/admin/queries";
import { audit } from "@/lib/auth/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const slug = (await params).slug;

  const result = await unlockBookPremium(slug, session.user.id);
  await audit({
    action: "admin.book.premium_unlocked",
    entityType: "book",
    entityId: slug,
    actorUserId: session.user.id,
    metadata: {
      entitlementId: result.entitlement.id,
      billingRecordId: result.billingRecord.id,
    },
  });

  return mutationResponse({ slug, unlocked: true });
}
