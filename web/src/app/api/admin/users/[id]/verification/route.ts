import { EMAIL_ACTION_RATE_LIMIT, EMAIL_VERIFICATION_TTL_SECONDS } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { hashToken, randomToken } from "@/lib/auth/crypto";
import { sendEmailVerificationEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const userId = (await params).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user?.email) {
    return Response.json({ ok: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "admin-verify-email-resend",
    key: user.email,
    ...EMAIL_ACTION_RATE_LIMIT,
  });
  if (!rateLimit.allowed) {
    return Response.json({ ok: false, error: "Doğrulama maili limiti aşıldı." }, { status: 429 });
  }

  const rawToken = randomToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
    },
  });
  await sendEmailVerificationEmail(user.email, rawToken);
  await audit({
    action: "admin.user.verification_resent",
    entityType: "user",
    entityId: user.id,
    actorUserId: session.user.id,
  });

  return mutationResponse({ sent: true });
}
